// src/store/AppStore.tsx
// Global state context - replaces SwiftData @Query / @Environment

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  initDatabase,
  seedDefaultExercises,
  seedDefaultAsanas,
  ensureUserGoalsExist,
  getUserGoals,
  updateUserGoals as dbUpdateGoals,
  getWeightEntries,
  insertWeightEntry as dbInsertWeight,
  deleteWeightEntry as dbDeleteWeight,
  getExercises,
  insertExercise as dbInsertExercise,
  updateExercise as dbUpdateExercise,
  deleteExercise as dbDeleteExercise,
  getRoutines,
  insertRoutine as dbInsertRoutine,
  updateRoutine as dbUpdateRoutine,
  deleteRoutine as dbDeleteRoutine,
  setRoutineExercises as dbSetRoutineExercises,
  getWorkoutSessions,
  insertWorkoutSession as dbInsertSession,
  updateWorkoutSession as dbUpdateSession,
  deleteWorkoutSession as dbDeleteSession,
  insertWorkoutSet as dbInsertSet,
  updateWorkoutSet as dbUpdateSet,
  deleteWorkoutSet as dbDeleteSet,
  getAsanas,
  insertAsana as dbInsertAsana,
  updateAsana as dbUpdateAsana,
  deleteAsana as dbDeleteAsana,
  getYogaFlows,
  insertYogaFlow as dbInsertFlow,
  updateYogaFlow as dbUpdateFlow,
  deleteYogaFlow as dbDeleteFlow,
  setYogaFlowAsanas as dbSetFlowAsanas,
  getYogaSessions,
  insertYogaSession as dbInsertYogaSession,
  updateYogaSession as dbUpdateYogaSession,
  deleteYogaSession as dbDeleteYogaSession,
  getMeditationSessions,
  insertMeditationSession as dbInsertMeditation,
  updateMeditationSession as dbUpdateMeditation,
  deleteMeditationSession as dbDeleteMeditation,
  UserGoals,
  WeightEntry,
  Exercise,
  WorkoutRoutine,
  WorkoutSession,
  WorkoutSet,
  Asana,
  YogaFlow,
  YogaSession,
  MeditationSession,
} from '../db/database';

interface AppState {
  initialized: boolean;
  goals: UserGoals | null;
  weightEntries: WeightEntry[];
  exercises: Exercise[];
  routines: WorkoutRoutine[];
  workoutSessions: WorkoutSession[];
  asanas: Asana[];
  yogaFlows: YogaFlow[];
  yogaSessions: YogaSession[];
  meditationSessions: MeditationSession[];

  // Actions
  refreshAll: () => void;
  updateGoals: (g: Partial<UserGoals>) => void;
  addWeightEntry: (v: number) => void;
  removeWeightEntry: (id: string) => void;
  addExercise: (name: string, cat: string, cardio: boolean) => Exercise;
  saveExercise: (ex: Exercise) => void;
  removeExercise: (id: string) => void;
  addRoutine: (name: string) => WorkoutRoutine;
  saveRoutine: (id: string, name: string) => void;
  removeRoutine: (id: string) => void;
  saveRoutineExercises: (routineId: string, exIds: string[]) => void;
  startWorkoutSession: (name: string, routine?: WorkoutRoutine) => WorkoutSession;
  saveWorkoutSession: (s: Partial<WorkoutSession> & { id: string }) => void;
  removeWorkoutSession: (id: string) => void;
  addWorkoutSet: (set: Omit<WorkoutSet, 'id' | 'timestamp'>) => WorkoutSet;
  saveWorkoutSet: (set: Partial<WorkoutSet> & { id: string }) => void;
  removeWorkoutSet: (id: string) => void;
  addAsana: (name: string, cats: string[]) => Asana;
  saveAsana: (a: Asana) => void;
  removeAsana: (id: string) => void;
  addYogaFlow: (name: string) => YogaFlow;
  saveYogaFlow: (id: string, name: string) => void;
  removeYogaFlow: (id: string) => void;
  saveFlowAsanas: (flowId: string, asanaIds: string[]) => void;
  addYogaSession: (s: Omit<YogaSession, 'id'>) => YogaSession;
  saveYogaSession: (s: YogaSession) => void;
  removeYogaSession: (id: string) => void;
  addMeditationSession: (duration: number, completed: boolean) => MeditationSession;
  saveMeditationSession: (s: MeditationSession) => void;
  removeMeditationSession: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [asanas, setAsanas] = useState<Asana[]>([]);
  const [yogaFlows, setYogaFlows] = useState<YogaFlow[]>([]);
  const [yogaSessions, setYogaSessions] = useState<YogaSession[]>([]);
  const [meditationSessions, setMeditationSessions] = useState<MeditationSession[]>([]);

  const refreshAll = useCallback(() => {
    setGoals(getUserGoals());
    setWeightEntries(getWeightEntries());
    setExercises(getExercises());
    setRoutines(getRoutines());
    setWorkoutSessions(getWorkoutSessions());
    setAsanas(getAsanas());
    setYogaFlows(getYogaFlows());
    setYogaSessions(getYogaSessions());
    setMeditationSessions(getMeditationSessions());
  }, []);

  useEffect(() => {
    initDatabase();
    seedDefaultExercises();
    seedDefaultAsanas();
    ensureUserGoalsExist();
    refreshAll();
    setInitialized(true);
  }, []);

  const value: AppState = {
    initialized,
    goals,
    weightEntries,
    exercises,
    routines,
    workoutSessions,
    asanas,
    yogaFlows,
    yogaSessions,
    meditationSessions,
    refreshAll,

    updateGoals: (g) => { dbUpdateGoals(g); setGoals(getUserGoals()); },
    addWeightEntry: (v) => { dbInsertWeight(v); setWeightEntries(getWeightEntries()); },
    removeWeightEntry: (id) => { dbDeleteWeight(id); setWeightEntries(getWeightEntries()); },

    addExercise: (name, cat, cardio) => { const ex = dbInsertExercise(name, cat, cardio); setExercises(getExercises()); return ex; },
    saveExercise: (ex) => { dbUpdateExercise(ex); setExercises(getExercises()); },
    removeExercise: (id) => { dbDeleteExercise(id); setExercises(getExercises()); },

    addRoutine: (name) => { const r = dbInsertRoutine(name); setRoutines(getRoutines()); return r; },
    saveRoutine: (id, name) => { dbUpdateRoutine(id, name); setRoutines(getRoutines()); },
    removeRoutine: (id) => { dbDeleteRoutine(id); setRoutines(getRoutines()); },
    saveRoutineExercises: (rid, exIds) => { dbSetRoutineExercises(rid, exIds); setRoutines(getRoutines()); },

    startWorkoutSession: (name, routine) => {
      const session = dbInsertSession(name);
      if (routine?.exercises) {
        for (const ex of routine.exercises) {
          dbInsertSet({ exerciseId: ex.id, sessionId: session.id, weight: ex.isCardio ? 0 : 45, reps: ex.isCardio ? 0 : 10, isCompleted: false, duration: ex.isCardio ? 600 : null, distance: ex.isCardio ? 1 : null, overriddenNotes: null });
        }
      }
      setWorkoutSessions(getWorkoutSessions());
      return getWorkoutSessions().find((s) => s.id === session.id)!;
    },
    saveWorkoutSession: (s) => { dbUpdateSession(s); setWorkoutSessions(getWorkoutSessions()); },
    removeWorkoutSession: (id) => { dbDeleteSession(id); setWorkoutSessions(getWorkoutSessions()); },

    addWorkoutSet: (set) => { const s = dbInsertSet(set); setWorkoutSessions(getWorkoutSessions()); return s; },
    saveWorkoutSet: (set) => { dbUpdateSet(set); setWorkoutSessions(getWorkoutSessions()); },
    removeWorkoutSet: (id) => { dbDeleteSet(id); setWorkoutSessions(getWorkoutSessions()); },

    addAsana: (name, cats) => { const a = dbInsertAsana(name, cats); setAsanas(getAsanas()); return a; },
    saveAsana: (a) => { dbUpdateAsana(a); setAsanas(getAsanas()); },
    removeAsana: (id) => { dbDeleteAsana(id); setAsanas(getAsanas()); },

    addYogaFlow: (name) => { const f = dbInsertFlow(name); setYogaFlows(getYogaFlows()); return f; },
    saveYogaFlow: (id, name) => { dbUpdateFlow(id, name); setYogaFlows(getYogaFlows()); },
    removeYogaFlow: (id) => { dbDeleteFlow(id); setYogaFlows(getYogaFlows()); },
    saveFlowAsanas: (fid, aids) => { dbSetFlowAsanas(fid, aids); setYogaFlows(getYogaFlows()); },

    addYogaSession: (s) => { const ys = dbInsertYogaSession(s); setYogaSessions(getYogaSessions()); return ys; },
    saveYogaSession: (s) => { dbUpdateYogaSession(s); setYogaSessions(getYogaSessions()); },
    removeYogaSession: (id) => { dbDeleteYogaSession(id); setYogaSessions(getYogaSessions()); },

    addMeditationSession: (dur, done) => { const m = dbInsertMeditation(dur, done); setMeditationSessions(getMeditationSessions()); return m; },
    saveMeditationSession: (s) => { dbUpdateMeditation(s); setMeditationSessions(getMeditationSessions()); },
    removeMeditationSession: (id) => { dbDeleteMeditation(id); setMeditationSessions(getMeditationSessions()); },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}
