// src/db/database.ts
// Mirrors all SwiftData models from Item.swift

import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('aroha.db');
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();

  db.execSync(`PRAGMA journal_mode = WAL;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS user_goals (
      id TEXT PRIMARY KEY,
      weekly_workout_goal INTEGER DEFAULT 4,
      daily_duration_goal REAL DEFAULT 45.0,
      target_weight REAL DEFAULT 150.0,
      current_weight REAL DEFAULT 150.0,
      weekly_yoga_goal INTEGER DEFAULT 3,
      daily_yoga_duration_goal REAL DEFAULT 30.0,
      weekly_meditation_goal INTEGER DEFAULT 5,
      daily_meditation_duration_goal REAL DEFAULT 15.0
    );

    CREATE TABLE IF NOT EXISTS weight_entries (
      id TEXT PRIMARY KEY,
      value REAL NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'Other',
      is_cardio INTEGER DEFAULT 0,
      video_url TEXT DEFAULT '',
      custom_notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS workout_routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      routine_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      PRIMARY KEY (routine_id, exercise_id)
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      duration REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      exercise_id TEXT,
      session_id TEXT,
      weight REAL DEFAULT 0,
      reps INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      duration REAL,
      distance REAL,
      overridden_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS asanas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categories TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS yoga_flows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS yoga_flow_asanas (
      flow_id TEXT NOT NULL,
      asana_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (flow_id, asana_id)
    );

    CREATE TABLE IF NOT EXISTS yoga_sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      duration REAL DEFAULT 0,
      categories TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS meditation_sessions (
      id TEXT PRIMARY KEY,
      duration REAL DEFAULT 0,
      date TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0
    );
  `);
}

// ─── Type definitions mirroring Swift models ───────────────────────

export interface UserGoals {
  id: string;
  weeklyWorkoutGoal: number;
  dailyDurationGoal: number;
  targetWeight: number;
  currentWeight: number;
  weeklyYogaGoal: number;
  dailyYogaDurationGoal: number;
  weeklyMeditationGoal: number;
  dailyMeditationDurationGoal: number;
}

export interface WeightEntry {
  id: string;
  value: number;
  date: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  isCardio: boolean;
  videoUrl: string;
  customNotes: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises?: Exercise[];
}

export interface WorkoutSet {
  id: string;
  exerciseId: string | null;
  sessionId: string | null;
  weight: number;
  reps: number;
  timestamp: string;
  isCompleted: boolean;
  duration: number | null;
  distance: number | null;
  overriddenNotes: string | null;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  isCompleted: boolean;
  duration: number;
  sets?: WorkoutSet[];
}

export interface Asana {
  id: string;
  name: string;
  categories: string[];
}

export interface YogaFlow {
  id: string;
  name: string;
  asanas?: Asana[];
}

export interface YogaSession {
  id: string;
  name: string;
  date: string;
  duration: number;
  categories: string[];
}

export interface MeditationSession {
  id: string;
  duration: number;
  date: string;
  isCompleted: boolean;
}

// ─── Helper ────────────────────────────────────────────────────────
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── UserGoals ─────────────────────────────────────────────────────
export function getUserGoals(): UserGoals | null {
  const db = getDb();
  const row = db.getFirstSync<any>(
    'SELECT * FROM user_goals LIMIT 1'
  );
  if (!row) return null;
  return {
    id: row.id,
    weeklyWorkoutGoal: row.weekly_workout_goal,
    dailyDurationGoal: row.daily_duration_goal,
    targetWeight: row.target_weight,
    currentWeight: row.current_weight,
    weeklyYogaGoal: row.weekly_yoga_goal,
    dailyYogaDurationGoal: row.daily_yoga_duration_goal,
    weeklyMeditationGoal: row.weekly_meditation_goal,
    dailyMeditationDurationGoal: row.daily_meditation_duration_goal,
  };
}

export function ensureUserGoalsExist(): UserGoals {
  const existing = getUserGoals();
  if (existing) return existing;
  const db = getDb();
  const id = uuid();
  db.runSync(
    `INSERT INTO user_goals VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, 4, 45.0, 150.0, 150.0, 3, 30.0, 5, 15.0]
  );
  return getUserGoals()!;
}

export function updateUserGoals(goals: Partial<UserGoals>): void {
  const db = getDb();
  const current = getUserGoals();
  if (!current) return;
  db.runSync(
    `UPDATE user_goals SET
      weekly_workout_goal=?, daily_duration_goal=?, target_weight=?,
      current_weight=?, weekly_yoga_goal=?, daily_yoga_duration_goal=?,
      weekly_meditation_goal=?, daily_meditation_duration_goal=?
    WHERE id=?`,
    [
      goals.weeklyWorkoutGoal ?? current.weeklyWorkoutGoal,
      goals.dailyDurationGoal ?? current.dailyDurationGoal,
      goals.targetWeight ?? current.targetWeight,
      goals.currentWeight ?? current.currentWeight,
      goals.weeklyYogaGoal ?? current.weeklyYogaGoal,
      goals.dailyYogaDurationGoal ?? current.dailyYogaDurationGoal,
      goals.weeklyMeditationGoal ?? current.weeklyMeditationGoal,
      goals.dailyMeditationDurationGoal ?? current.dailyMeditationDurationGoal,
      current.id,
    ]
  );
}

// ─── WeightEntries ─────────────────────────────────────────────────
export function getWeightEntries(): WeightEntry[] {
  const db = getDb();
  return db.getAllSync<any>('SELECT * FROM weight_entries ORDER BY date DESC').map((r) => ({
    id: r.id,
    value: r.value,
    date: r.date,
  }));
}

export function insertWeightEntry(value: number): WeightEntry {
  const db = getDb();
  const id = uuid();
  const date = new Date().toISOString();
  db.runSync('INSERT INTO weight_entries VALUES (?,?,?)', [id, value, date]);
  return { id, value, date };
}

export function deleteWeightEntry(id: string): void {
  getDb().runSync('DELETE FROM weight_entries WHERE id=?', [id]);
}

// ─── Exercises ─────────────────────────────────────────────────────
export function getExercises(): Exercise[] {
  const db = getDb();
  return db.getAllSync<any>('SELECT * FROM exercises ORDER BY name').map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    isCardio: r.is_cardio === 1,
    videoUrl: r.video_url ?? '',
    customNotes: r.custom_notes ?? '',
  }));
}

export function insertExercise(name: string, category: string, isCardio: boolean): Exercise {
  const db = getDb();
  const id = uuid();
  db.runSync('INSERT INTO exercises VALUES (?,?,?,?,?,?)', [id, name, category, isCardio ? 1 : 0, '', '']);
  return { id, name, category, isCardio, videoUrl: '', customNotes: '' };
}

export function updateExercise(ex: Exercise): void {
  getDb().runSync(
    'UPDATE exercises SET name=?, category=?, is_cardio=?, video_url=?, custom_notes=? WHERE id=?',
    [ex.name, ex.category, ex.isCardio ? 1 : 0, ex.videoUrl, ex.customNotes, ex.id]
  );
}

export function deleteExercise(id: string): void {
  getDb().runSync('DELETE FROM exercises WHERE id=?', [id]);
}

export function seedDefaultExercises(): void {
  const db = getDb();
  const count = db.getFirstSync<any>('SELECT COUNT(*) as c FROM exercises');
  if (count && count.c > 0) return;

  const defaults: [string, string, boolean][] = [
    // CHEST
    ['Bench Press', 'Chest', false], ['Push-ups', 'Chest', false], ['Incline Dumbbell Press', 'Chest', false],
    ['Cable Flyes', 'Chest', false], ['Chest Press Machine', 'Chest', false], ['Pec Deck Machine', 'Chest', false],
    ['Dumbbell Flyes', 'Chest', false], ['Decline Bench Press', 'Chest', false], ['Smith Machine Bench Press', 'Chest', false],
    ['Dips', 'Chest', false], ['Hammer Strength Chest Press', 'Chest', false], ['Incline Cable Flyes', 'Chest', false],
    // BACK
    ['Pull-ups', 'Back', false], ['Lat Pulldowns', 'Back', false], ['Barbell Rows', 'Back', false],
    ['Seated Cable Row', 'Back', false], ['Dumbbell One-Arm Row', 'Back', false], ['Assisted Pull-up Machine', 'Back', false],
    ['T-Bar Row', 'Back', false], ['Reverse Pec Deck', 'Back', false], ['Cable Lat Pulldown', 'Back', false],
    ['Straight Arm Cable Pulldown', 'Back', false], ['Deadlifts', 'Back', false], ['Inverted Row', 'Back', false],
    // SHOULDERS
    ['Overhead Barbell Press', 'Shoulders', false], ['Dumbbell Lateral Raises', 'Shoulders', false], ['Face Pulls', 'Shoulders', false],
    ['Seated Dumbbell Press', 'Shoulders', false], ['Arnold Press', 'Shoulders', false], ['Front Raises', 'Shoulders', false],
    ['Upright Rows', 'Shoulders', false], ['Machine Shoulder Press', 'Shoulders', false], ['Cable Lateral Raises', 'Shoulders', false],
    ['Reverse Cable Flyes', 'Shoulders', false], ['Shrugs', 'Shoulders', false], ['Dumbbell Rear Delt Flyes', 'Shoulders', false],
    // BICEPS
    ['Bicep Curls', 'Biceps', false], ['Hammer Curls', 'Biceps', false], ['Chin-ups', 'Biceps', false],
    ['Preacher Curl Machine', 'Biceps', false], ['Cable Bicep Curls', 'Biceps', false], ['Concentration Curls', 'Biceps', false],
    ['EZ Bar Curl', 'Biceps', false], ['Incline Dumbbell Curl', 'Biceps', false], ['Reverse Grip Barbell Curl', 'Biceps', false],
    ['Spider Curls', 'Biceps', false], ['Open Cable Curls', 'Biceps', false], ['Dumbbell Zottman Curls', 'Biceps', false],
    // TRICEPS
    ['Tricep Pushdowns', 'Triceps', false], ['Skull Crushers', 'Triceps', false], ['Dips (Triceps)', 'Triceps', false],
    ['Overhead Dumbbell Extension', 'Triceps', false], ['Cable Overhead Extension', 'Triceps', false], ['Tricep Dips Machine', 'Triceps', false],
    ['Close Grip Bench Press', 'Triceps', false], ['Tricep Kickbacks', 'Triceps', false], ['Bench Dips', 'Triceps', false],
    ['Rope Tricep Pushdown', 'Triceps', false], ['EZ Bar French Press', 'Triceps', false], ['Diamond Push-ups', 'Triceps', false],
    // ABS
    ['Planks', 'Abs', false], ['Crunches', 'Abs', false], ['Hanging Leg Raises', 'Abs', false],
    ['Russian Twists', 'Abs', false], ['Cable Crunches', 'Abs', false], ['Ab Machine', 'Abs', false],
    ['Leg Raises', 'Abs', false], ['Mountain Climbers', 'Abs', false], ['Bicycle Crunches', 'Abs', false],
    ['Plank Knee-to-Elbow', 'Abs', false], ['Dead Bug', 'Abs', false], ['Woodchoppers', 'Abs', false],
    // QUADS
    ['Squats', 'Quads', false], ['Leg Press', 'Quads', false], ['Lunges', 'Quads', false],
    ['Leg Extensions', 'Quads', false], ['Goblet Squats', 'Quads', false], ['Smith Machine Squat', 'Quads', false],
    ['Step-ups', 'Quads', false], ['Hack Squat Machine', 'Quads', false], ['Wall Sit', 'Quads', false], ['Bulgarian Split Squats', 'Quads', false],
    // HAMSTRINGS & GLUTES
    ['Romanian Deadlifts', 'Hamstrings', false], ['Lying Leg Curls', 'Hamstrings', false], ['Hip Thrusts', 'Glutes', false],
    ['Glute Bridges', 'Glutes', false], ['Bulgarian Split Squats (Glutes)', 'Glutes', false], ['Seated Leg Curl', 'Hamstrings', false],
    ['Stiff-legged Deadlift', 'Hamstrings', false], ['Glute Kickback Machine', 'Glutes', false], ['Cable Glute Kickbacks', 'Hamstrings', false],
    ['Dumbbell Hip Thrusts', 'Glutes', false], ['Single Leg RDL', 'Hamstrings', false], ['Sumo Deadlift', 'Hamstrings', false],
    // CALVES
    ['Standing Calf Raises', 'Calves', false], ['Seated Calf Raises', 'Calves', false], ['Leg Press Calf Raises', 'Calves', false],
    ['Smith Machine Calf Raise', 'Calves', false], ['Dumbbell Calf Raises', 'Calves', false], ['Jump Rope', 'Calves', true],
    // CARDIO
    ['Running', 'Cardio', true], ['Cycling', 'Cardio', true], ['Rowing Machine', 'Cardio', true],
    ['Elliptical', 'Cardio', true], ['Swimming', 'Cardio', true], ['Stair Climber', 'Cardio', true],
  ];

  db.withTransactionSync(() => {
    for (const [name, cat, cardio] of defaults) {
      const id = uuid();
      db.runSync('INSERT INTO exercises VALUES (?,?,?,?,?,?)', [id, name, cat, cardio ? 1 : 0, '', '']);
    }
  });
}

// ─── WorkoutRoutines ───────────────────────────────────────────────
export function getRoutines(): WorkoutRoutine[] {
  const db = getDb();
  const rows = db.getAllSync<any>('SELECT * FROM workout_routines ORDER BY name');
  return rows.map((r) => {
    const exercises = db.getAllSync<any>(
      `SELECT e.* FROM exercises e
       JOIN routine_exercises re ON re.exercise_id = e.id
       WHERE re.routine_id = ? ORDER BY e.name`,
      [r.id]
    ).map(mapExercise);
    return { id: r.id, name: r.name, exercises };
  });
}

export function insertRoutine(name: string): WorkoutRoutine {
  const db = getDb();
  const id = uuid();
  db.runSync('INSERT INTO workout_routines VALUES (?,?)', [id, name]);
  return { id, name, exercises: [] };
}

export function updateRoutine(id: string, name: string): void {
  getDb().runSync('UPDATE workout_routines SET name=? WHERE id=?', [name, id]);
}

export function deleteRoutine(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM routine_exercises WHERE routine_id=?', [id]);
  db.runSync('DELETE FROM workout_routines WHERE id=?', [id]);
}

export function setRoutineExercises(routineId: string, exerciseIds: string[]): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM routine_exercises WHERE routine_id=?', [routineId]);
    for (const eid of exerciseIds) {
      db.runSync('INSERT INTO routine_exercises VALUES (?,?)', [routineId, eid]);
    }
  });
}

// ─── WorkoutSessions ───────────────────────────────────────────────
function mapExercise(r: any): Exercise {
  return {
    id: r.id, name: r.name, category: r.category,
    isCardio: r.is_cardio === 1, videoUrl: r.video_url ?? '', customNotes: r.custom_notes ?? '',
  };
}

export function getWorkoutSessions(): WorkoutSession[] {
  const db = getDb();
  const rows = db.getAllSync<any>('SELECT * FROM workout_sessions ORDER BY date DESC');
  return rows.map((r) => {
    const sets = db.getAllSync<any>(
      'SELECT ws.*, e.id as eid, e.name as ename, e.category, e.is_cardio, e.video_url, e.custom_notes FROM workout_sets ws LEFT JOIN exercises e ON e.id = ws.exercise_id WHERE ws.session_id=? ORDER BY ws.timestamp',
      [r.id]
    ).map((s) => ({
      id: s.id, exerciseId: s.exercise_id, sessionId: s.session_id,
      weight: s.weight, reps: s.reps, timestamp: s.timestamp,
      isCompleted: s.is_completed === 1, duration: s.duration, distance: s.distance,
      overriddenNotes: s.overridden_notes,
      exercise: s.eid ? { id: s.eid, name: s.ename, category: s.category, isCardio: s.is_cardio === 1, videoUrl: s.video_url ?? '', customNotes: s.custom_notes ?? '' } : undefined,
    } as WorkoutSet));
    return { id: r.id, date: r.date, name: r.name, isCompleted: r.is_completed === 1, duration: r.duration, sets };
  });
}

export function insertWorkoutSession(name: string): WorkoutSession {
  const db = getDb();
  const id = uuid();
  const date = new Date().toISOString();
  db.runSync('INSERT INTO workout_sessions VALUES (?,?,?,?,?)', [id, date, name, 0, 0]);
  return { id, date, name, isCompleted: false, duration: 0, sets: [] };
}

export function updateWorkoutSession(session: Partial<WorkoutSession> & { id: string }): void {
  const db = getDb();
  const cur = db.getFirstSync<any>('SELECT * FROM workout_sessions WHERE id=?', [session.id]);
  if (!cur) return;
  db.runSync(
    'UPDATE workout_sessions SET name=?, is_completed=?, duration=? WHERE id=?',
    [session.name ?? cur.name, session.isCompleted !== undefined ? (session.isCompleted ? 1 : 0) : cur.is_completed, session.duration ?? cur.duration, session.id]
  );
}

export function deleteWorkoutSession(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM workout_sets WHERE session_id=?', [id]);
  db.runSync('DELETE FROM workout_sessions WHERE id=?', [id]);
}

// ─── WorkoutSets ───────────────────────────────────────────────────
export function insertWorkoutSet(set: Omit<WorkoutSet, 'id' | 'timestamp'>): WorkoutSet {
  const db = getDb();
  const id = uuid();
  const timestamp = new Date().toISOString();
  db.runSync(
    'INSERT INTO workout_sets VALUES (?,?,?,?,?,?,?,?,?,?)',
    [id, set.exerciseId, set.sessionId, set.weight, set.reps, timestamp, set.isCompleted ? 1 : 0, set.duration ?? null, set.distance ?? null, set.overriddenNotes ?? null]
  );
  return { ...set, id, timestamp };
}

export function updateWorkoutSet(set: Partial<WorkoutSet> & { id: string }): void {
  const db = getDb();
  const cur = db.getFirstSync<any>('SELECT * FROM workout_sets WHERE id=?', [set.id]);
  if (!cur) return;
  db.runSync(
    'UPDATE workout_sets SET weight=?, reps=?, is_completed=?, duration=?, distance=?, overridden_notes=? WHERE id=?',
    [set.weight ?? cur.weight, set.reps ?? cur.reps, set.isCompleted !== undefined ? (set.isCompleted ? 1 : 0) : cur.is_completed, set.duration !== undefined ? set.duration : cur.duration, set.distance !== undefined ? set.distance : cur.distance, set.overriddenNotes !== undefined ? set.overriddenNotes : cur.overridden_notes, set.id]
  );
}

export function deleteWorkoutSet(id: string): void {
  getDb().runSync('DELETE FROM workout_sets WHERE id=?', [id]);
}

// ─── Asanas ────────────────────────────────────────────────────────
export function getAsanas(): Asana[] {
  return getDb().getAllSync<any>('SELECT * FROM asanas ORDER BY name').map((r) => ({
    id: r.id, name: r.name, categories: JSON.parse(r.categories ?? '[]'),
  }));
}

export function insertAsana(name: string, categories: string[]): Asana {
  const db = getDb();
  const id = uuid();
  db.runSync('INSERT INTO asanas VALUES (?,?,?)', [id, name, JSON.stringify(categories)]);
  return { id, name, categories };
}

export function updateAsana(asana: Asana): void {
  getDb().runSync('UPDATE asanas SET name=?, categories=? WHERE id=?', [asana.name, JSON.stringify(asana.categories), asana.id]);
}

export function deleteAsana(id: string): void {
  getDb().runSync('DELETE FROM asanas WHERE id=?', [id]);
}

export function seedDefaultAsanas(): void {
  const db = getDb();
  const count = db.getFirstSync<any>('SELECT COUNT(*) as c FROM asanas');
  if (count && count.c > 0) return;
  const defaults: [string, string[]][] = [
    ['Downward-Facing Dog', ['Inversion', 'Hamstrings']],
    ['Warrior I', ['Standing', 'Quads']],
    ['Warrior II', ['Standing', 'Hips']],
    ['Cobra Pose', ['Backbend', 'Spine']],
    ['Tree Pose', ['Balance', 'Focus']],
    ["Child's Pose", ['Restorative', 'Flexibility']],
    ['Savasana', ['Restorative', 'Mindfulness']],
    ['Triangle Pose', ['Standing', 'Hamstrings']],
    ['Plank Pose', ['Core', 'Strength']],
    ['Seated Forward Bend', ['Flexibility', 'Hamstrings']],
    ['Bridge Pose', ['Backbend', 'Glutes']],
    ['Cat-Cow Stretch', ['Spine', 'Flexibility']],
    ['Pigeon Pose', ['Hips', 'Flexibility']],
    ["Corpse Pose", ['Restorative', 'Mindfulness']],
  ];
  db.withTransactionSync(() => {
    for (const [name, cats] of defaults) {
      const id = uuid();
      db.runSync('INSERT INTO asanas VALUES (?,?,?)', [id, name, JSON.stringify(cats)]);
    }
  });
}

// ─── YogaFlows ─────────────────────────────────────────────────────
export function getYogaFlows(): YogaFlow[] {
  const db = getDb();
  return db.getAllSync<any>('SELECT * FROM yoga_flows ORDER BY name').map((r) => {
    const asanas = db.getAllSync<any>(
      `SELECT a.* FROM asanas a JOIN yoga_flow_asanas yfa ON yfa.asana_id = a.id WHERE yfa.flow_id=? ORDER BY yfa.sort_order`,
      [r.id]
    ).map((a) => ({ id: a.id, name: a.name, categories: JSON.parse(a.categories ?? '[]') }));
    return { id: r.id, name: r.name, asanas };
  });
}

export function insertYogaFlow(name: string): YogaFlow {
  const db = getDb();
  const id = uuid();
  db.runSync('INSERT INTO yoga_flows VALUES (?,?)', [id, name]);
  return { id, name, asanas: [] };
}

export function updateYogaFlow(id: string, name: string): void {
  getDb().runSync('UPDATE yoga_flows SET name=? WHERE id=?', [name, id]);
}

export function deleteYogaFlow(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM yoga_flow_asanas WHERE flow_id=?', [id]);
  db.runSync('DELETE FROM yoga_flows WHERE id=?', [id]);
}

export function setYogaFlowAsanas(flowId: string, asanaIds: string[]): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM yoga_flow_asanas WHERE flow_id=?', [flowId]);
    asanaIds.forEach((aid, idx) => {
      db.runSync('INSERT INTO yoga_flow_asanas VALUES (?,?,?)', [flowId, aid, idx]);
    });
  });
}

// ─── YogaSessions ──────────────────────────────────────────────────
export function getYogaSessions(): YogaSession[] {
  return getDb().getAllSync<any>('SELECT * FROM yoga_sessions ORDER BY date DESC').map((r) => ({
    id: r.id, name: r.name, date: r.date, duration: r.duration,
    categories: JSON.parse(r.categories ?? '[]'),
  }));
}

export function insertYogaSession(session: Omit<YogaSession, 'id'>): YogaSession {
  const db = getDb();
  const id = uuid();
  db.runSync('INSERT INTO yoga_sessions VALUES (?,?,?,?,?)', [id, session.name, session.date, session.duration, JSON.stringify(session.categories)]);
  return { ...session, id };
}

export function updateYogaSession(session: YogaSession): void {
  getDb().runSync('UPDATE yoga_sessions SET name=?, date=?, duration=?, categories=? WHERE id=?', [session.name, session.date, session.duration, JSON.stringify(session.categories), session.id]);
}

export function deleteYogaSession(id: string): void {
  getDb().runSync('DELETE FROM yoga_sessions WHERE id=?', [id]);
}

// ─── MeditationSessions ────────────────────────────────────────────
export function getMeditationSessions(): MeditationSession[] {
  return getDb().getAllSync<any>('SELECT * FROM meditation_sessions ORDER BY date DESC').map((r) => ({
    id: r.id, duration: r.duration, date: r.date, isCompleted: r.is_completed === 1,
  }));
}

export function insertMeditationSession(duration: number, isCompleted: boolean): MeditationSession {
  const db = getDb();
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); });
  const date = new Date().toISOString();
  db.runSync('INSERT INTO meditation_sessions VALUES (?,?,?,?)', [id, duration, date, isCompleted ? 1 : 0]);
  return { id, duration, date, isCompleted };
}

export function updateMeditationSession(session: MeditationSession): void {
  getDb().runSync('UPDATE meditation_sessions SET duration=?, date=?, is_completed=? WHERE id=?', [session.duration, session.date, session.isCompleted ? 1 : 0, session.id]);
}

export function deleteMeditationSession(id: string): void {
  getDb().runSync('DELETE FROM meditation_sessions WHERE id=?', [id]);
}
