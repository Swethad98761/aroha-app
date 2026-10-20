// src/db/workoutAnalytics.ts
// Progressive overload, PR tracking, workout history analysis

import { getDb } from './database';

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  bestVolume: number; // weight × reps
  bestWeightDate: string;
  bestRepsDate: string;
}

export interface ExerciseHistory {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

export interface LastSessionSet {
  weight: number;
  reps: number;
  isCardio: boolean;
  duration: number | null;
  distance: number | null;
}

// Get all-time PR for an exercise
export function getExercisePR(exerciseId: string): ExercisePR | null {
  const db = getDb();
  const ex = db.getFirstSync<any>('SELECT * FROM exercises WHERE id=?', [exerciseId]);
  if (!ex) return null;

  const sets = db.getAllSync<any>(
    `SELECT ws.*, wse.date FROM workout_sets ws
     JOIN workout_sessions wse ON wse.id = ws.session_id
     WHERE ws.exercise_id=? AND ws.is_completed=1
     ORDER BY wse.date DESC`,
    [exerciseId]
  );

  if (sets.length === 0) return null;

  let bestWeight = 0, bestReps = 0, bestVolume = 0;
  let bestWeightDate = '', bestRepsDate = '';

  for (const s of sets) {
    const vol = s.weight * s.reps;
    if (s.weight > bestWeight) { bestWeight = s.weight; bestWeightDate = s.date; }
    if (s.reps > bestReps) { bestReps = s.reps; bestRepsDate = s.date; }
    if (vol > bestVolume) bestVolume = vol;
  }

  return { exerciseId, exerciseName: ex.name, bestWeight, bestReps, bestVolume, bestWeightDate, bestRepsDate };
}

// Get last session's sets for an exercise (for progressive overload hints)
export function getLastSessionSets(exerciseId: string, currentSessionId: string): LastSessionSet[] {
  const db = getDb();
  const lastSession = db.getFirstSync<any>(
    `SELECT ws.* FROM workout_sessions ws
     WHERE ws.id != ? AND ws.is_completed = 1
     AND EXISTS (
       SELECT 1 FROM workout_sets wst
       WHERE wst.session_id = ws.id AND wst.exercise_id = ?
     )
     ORDER BY ws.date DESC LIMIT 1`,
    [currentSessionId, exerciseId]
  );

  if (!lastSession) return [];

  return db.getAllSync<any>(
    `SELECT * FROM workout_sets WHERE session_id=? AND exercise_id=? AND is_completed=1`,
    [lastSession.id, exerciseId]
  ).map((s) => ({
    weight: s.weight,
    reps: s.reps,
    isCardio: s.duration != null,
    duration: s.duration,
    distance: s.distance,
  }));
}

// Check if a completed set is a new PR
export function checkForPR(exerciseId: string, weight: number, reps: number, currentSessionId: string): { isWeightPR: boolean; isRepsPR: boolean; isVolumePR: boolean } {
  const db = getDb();

  const prev = db.getAllSync<any>(
    `SELECT ws.weight, ws.reps FROM workout_sets ws
     JOIN workout_sessions wse ON wse.id = ws.session_id
     WHERE ws.exercise_id=? AND ws.is_completed=1 AND wse.id != ?`,
    [exerciseId, currentSessionId]
  );

  if (prev.length === 0) return { isWeightPR: false, isRepsPR: false, isVolumePR: false };

  const maxWeight = Math.max(...prev.map((s) => s.weight));
  const maxReps = Math.max(...prev.map((s) => s.reps));
  const maxVolume = Math.max(...prev.map((s) => s.weight * s.reps));

  return {
    isWeightPR: weight > maxWeight,
    isRepsPR: reps > maxReps,
    isVolumePR: weight * reps > maxVolume,
  };
}

// Get exercise volume history for charts (last 90 days)
export function getExerciseHistory(exerciseId: string): ExerciseHistory[] {
  const db = getDb();
  const rows = db.getAllSync<any>(
    `SELECT wse.date, MAX(ws.weight) as weight, MAX(ws.reps) as reps, MAX(ws.weight * ws.reps) as volume
     FROM workout_sets ws
     JOIN workout_sessions wse ON wse.id = ws.session_id
     WHERE ws.exercise_id=? AND ws.is_completed=1
     GROUP BY DATE(wse.date)
     ORDER BY wse.date ASC
     LIMIT 30`,
    [exerciseId]
  );
  return rows.map((r) => ({ date: r.date, weight: r.weight, reps: r.reps, volume: r.volume }));
}

// Get all PRs for display in library
export function getAllPRs(): ExercisePR[] {
  const db = getDb();
  const exercises = db.getAllSync<any>('SELECT id FROM exercises WHERE is_cardio=0');
  return exercises
    .map((e) => getExercisePR(e.id))
    .filter(Boolean) as ExercisePR[];
}

// Calculate suggested weight/reps for next session (progressive overload)
export function getSuggestion(lastSets: LastSessionSet[]): { weight: number; reps: number } | null {
  if (lastSets.length === 0) return null;
  const avgWeight = lastSets.reduce((s, l) => s + l.weight, 0) / lastSets.length;
  const avgReps = lastSets.reduce((s, l) => s + l.reps, 0) / lastSets.length;
  // Progressive overload: +2.5 lbs or +1 rep alternating
  const suggestedWeight = avgReps >= 12 ? Math.round((avgWeight + 2.5) * 2) / 2 : avgWeight;
  const suggestedReps = avgReps >= 12 ? 8 : Math.round(avgReps) + 1;
  return { weight: suggestedWeight, reps: Math.min(suggestedReps, 15) };
}

// Get total workout stats
export function getWorkoutStats(): { totalWorkouts: number; totalSets: number; totalVolume: number; totalDuration: number; streak: number } {
  const db = getDb();
  const sessions = db.getFirstSync<any>(
    'SELECT COUNT(*) as count, SUM(duration) as duration FROM workout_sessions WHERE is_completed=1'
  );
  const sets = db.getFirstSync<any>(
    'SELECT COUNT(*) as count, SUM(weight * reps) as volume FROM workout_sets WHERE is_completed=1'
  );

  // Calculate streak
  const dates = db.getAllSync<any>(
    `SELECT DISTINCT DATE(date) as d FROM workout_sessions WHERE is_completed=1 ORDER BY d DESC`
  ).map((r) => r.d);

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (dates[i] === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }

  return {
    totalWorkouts: sessions?.count ?? 0,
    totalSets: sets?.count ?? 0,
    totalVolume: sets?.volume ?? 0,
    totalDuration: sessions?.duration ?? 0,
    streak,
  };
}

// Detect deload suggestion (4+ consecutive weeks of training)
export function shouldSuggestDeload(): boolean {
  const db = getDb();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const count = db.getFirstSync<any>(
    `SELECT COUNT(*) as c FROM workout_sessions WHERE is_completed=1 AND date > ?`,
    [fourWeeksAgo.toISOString()]
  );
  return (count?.c ?? 0) >= 12; // 3+ sessions/week for 4 weeks
}

// Get repeat workout suggestion
export function getRepeatWorkoutSuggestion(): string | null {
  const db = getDb();
  const last = db.getFirstSync<any>(
    'SELECT name FROM workout_sessions WHERE is_completed=1 ORDER BY date DESC LIMIT 1'
  );
  return last?.name ?? null;
}

// Get muscles not trained recently
export function getNeglectedMuscles(): string[] {
  const db = getDb();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const trained = db.getAllSync<any>(
    `SELECT DISTINCT e.category FROM workout_sets ws
     JOIN exercises e ON e.id = ws.exercise_id
     JOIN workout_sessions wse ON wse.id = ws.session_id
     WHERE wse.date > ? AND ws.is_completed=1`,
    [sevenDaysAgo.toISOString()]
  ).map((r) => r.category);

  const allMuscles = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Quads', 'Hamstrings', 'Glutes'];
  return allMuscles.filter((m) => !trained.includes(m));
}
