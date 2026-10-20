// src/db/stepTracker.ts
import { getDb } from './database';

export interface StepEntry {
  id: string;
  date: string;
  steps: number;
  miles: number;
  calories: number;
}

export async function initStepTable(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS step_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      steps INTEGER DEFAULT 0,
      miles REAL DEFAULT 0,
      calories REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS exercise_favourites (
      exercise_id TEXT PRIMARY KEY,
      added_at TEXT NOT NULL
    );
  `);
  await dedupeStepEntries();
}

// Self-healing cleanup: if any calendar day ended up with more than one
// step_entries row (can happen from an old race condition between manual
// logging and the live tracker writing at nearly the same moment), keep
// only the most recently written row per day and drop the rest. Runs on
// every app start; it's a no-op once the data is clean.
async function dedupeStepEntries(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    DELETE FROM step_entries
    WHERE rowid NOT IN (
      SELECT MAX(rowid) FROM step_entries GROUP BY DATE(date)
    );
  `);
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Steps: 2000 steps ≈ 1 mile, 1 mile ≈ 100 calories
export function stepsToMiles(steps: number): number {
  return Math.round((steps / 2000) * 100) / 100;
}
export function stepsToCalories(steps: number): number {
  return Math.round(steps * 0.05);
}

export function getTodaySteps(): StepEntry | null {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const row = db.getFirstSync<any>('SELECT * FROM step_entries WHERE DATE(date)=?', [today]);
  if (!row) return null;
  return { id: row.id, date: row.date, steps: row.steps, miles: row.miles, calories: row.calories };
}

export function logSteps(steps: number): StepEntry {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  // Grab ALL rows matching today (not just the first) so we can collapse
  // any accidental duplicates down to one row instead of adding another.
  const existingRows = db.getAllSync<any>('SELECT * FROM step_entries WHERE DATE(date)=? ORDER BY rowid DESC', [today]);
  const miles = stepsToMiles(steps);
  const calories = stepsToCalories(steps);
  if (existingRows.length > 0) {
    const keep = existingRows[0];
    if (existingRows.length > 1) {
      const staleIds = existingRows.slice(1).map((r) => r.id);
      db.runSync(`DELETE FROM step_entries WHERE id IN (${staleIds.map(() => '?').join(',')})`, staleIds);
    }
    db.runSync('UPDATE step_entries SET steps=?, miles=?, calories=? WHERE id=?', [steps, miles, calories, keep.id]);
    return { id: keep.id, date: keep.date, steps, miles, calories };
  }
  const id = uuid();
  const date = new Date().toISOString();
  db.runSync('INSERT INTO step_entries VALUES (?,?,?,?,?)', [id, date, steps, miles, calories]);
  return { id, date, steps, miles, calories };
}

export function getStepHistory(): StepEntry[] {
  const db = getDb();
  return db.getAllSync<any>('SELECT * FROM step_entries ORDER BY date DESC LIMIT 30').map((r) => ({
    id: r.id, date: r.date, steps: r.steps, miles: r.miles, calories: r.calories,
  }));
}

export function getWeeklyStepTotal(): number {
  const db = getDb();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const row = db.getFirstSync<any>('SELECT SUM(steps) as total FROM step_entries WHERE date > ?', [weekAgo.toISOString()]);
  return row?.total ?? 0;
}

// ─── Favourites ─────────────────────────────────────────────────
export function getFavouriteIds(): string[] {
  const db = getDb();
  return db.getAllSync<any>('SELECT exercise_id FROM exercise_favourites ORDER BY added_at DESC').map((r) => r.exercise_id);
}

export function addFavourite(exerciseId: string): void {
  const db = getDb();
  db.runSync('INSERT OR IGNORE INTO exercise_favourites VALUES (?,?)', [exerciseId, new Date().toISOString()]);
}

export function removeFavourite(exerciseId: string): void {
  getDb().runSync('DELETE FROM exercise_favourites WHERE exercise_id=?', [exerciseId]);
}

export function isFavourite(exerciseId: string): boolean {
  const db = getDb();
  const row = db.getFirstSync<any>('SELECT 1 FROM exercise_favourites WHERE exercise_id=?', [exerciseId]);
  return !!row;
}
