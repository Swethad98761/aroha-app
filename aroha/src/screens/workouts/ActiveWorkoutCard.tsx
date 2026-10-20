// src/screens/workouts/ActiveWorkoutCard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Modal,
} from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { WorkoutSession, WorkoutSet, Exercise } from '../../db/database';
import { AppLayout, Colors, cardStyle } from '../../theme';
import { Card } from '../../components/SharedComponents';
import { formatTime } from '../../utils';

interface Props {
  session: WorkoutSession;
  exercises: Exercise[];
  accentColor: string;
  onComplete: () => void;
  onDelete: () => void;
}

export function ActiveWorkoutCard({ session, exercises, accentColor, onComplete, onDelete }: Props) {
  const { addWorkoutSet, saveWorkoutSet, removeWorkoutSet, workoutSessions } = useAppStore();
  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [search, setSearch] = useState('');

  // Live session data from store
  const liveSession = workoutSessions.find((s) => s.id === session.id) ?? session;
  const sets = liveSession.sets ?? [];

  useEffect(() => {
    const start = new Date(session.date).getTime();
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(tick);
  }, [session.date]);

  function handleAddSet(exercise: Exercise) {
    addWorkoutSet({
      exerciseId: exercise.id,
      sessionId: session.id,
      weight: exercise.isCardio ? 0 : 45,
      reps: exercise.isCardio ? 0 : 10,
      isCompleted: false,
      duration: exercise.isCardio ? 600 : null,
      distance: exercise.isCardio ? 1.0 : null,
      overriddenNotes: null,
    });
    setShowAddExercise(false);
    setSearch('');
  }

  function handleDeleteSet(id: string) {
    removeWorkoutSet(id);
  }

  function handleComplete() {
    Alert.alert('Complete Workout?', `Duration: ${formatTime(elapsed)}`, [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Finish', style: 'default', onPress: onComplete },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All sets will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onDelete },
    ]);
  }

  // Group sets by exercise
  const grouped: { exercise: Exercise | null; sets: WorkoutSet[] }[] = [];
  const seen = new Map<string | null, WorkoutSet[]>();
  for (const s of sets) {
    const key = s.exerciseId ?? '__none__';
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(s);
  }
  seen.forEach((setSList, key) => {
    const ex = exercises.find((e) => e.id === key) ?? null;
    grouped.push({ exercise: ex, sets: setSList });
  });

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sessionName}>{liveSession.name}</Text>
          <Text style={[styles.timer, { color: accentColor }]}>⏱ {formatTime(elapsed)}</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={[styles.completeBtn, { backgroundColor: accentColor }]} onPress={handleComplete}>
            <Text style={styles.completeBtnLabel}>Finish</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDiscard}>
            <Text style={styles.discardBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sets grouped by exercise */}
      {grouped.map(({ exercise, sets: exSets }, gIdx) => (
        <View key={gIdx} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{exercise?.name ?? 'Unknown'}</Text>
            <Text style={styles.groupCategory}>{exercise?.category}</Text>
          </View>
          {exSets.map((set, sIdx) => (
            <SetRow
              key={set.id}
              set={set}
              index={sIdx}
              isCardio={exercise?.isCardio ?? false}
              accentColor={accentColor}
              onUpdate={(updates) => saveWorkoutSet({ id: set.id, ...updates })}
              onDelete={() => handleDeleteSet(set.id)}
            />
          ))}
          <TouchableOpacity
            style={styles.addSetBtn}
            onPress={() => exercise && addWorkoutSet({ exerciseId: exercise.id, sessionId: session.id, weight: exercise.isCardio ? 0 : 45, reps: exercise.isCardio ? 0 : 10, isCompleted: false, duration: exercise.isCardio ? 600 : null, distance: null, overriddenNotes: null })}
          >
            <Text style={[styles.addSetBtnLabel, { color: accentColor }]}>＋ Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Exercise Button */}
      <TouchableOpacity style={[styles.addExBtn, { borderColor: accentColor }]} onPress={() => setShowAddExercise(true)}>
        <Text style={[styles.addExBtnLabel, { color: accentColor }]}>＋ Add Exercise</Text>
      </TouchableOpacity>

      {/* Exercise picker modal */}
      <Modal visible={showAddExercise} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddExercise(false)}>
        <View style={styles.picker}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Add Exercise</Text>
            <TouchableOpacity onPress={() => setShowAddExercise(false)}>
              <Text style={styles.pickerClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.pickerSearch}
            placeholder="Search exercises…"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <ScrollView>
            {filteredExercises.map((ex) => (
              <TouchableOpacity key={ex.id} style={styles.pickerItem} onPress={() => handleAddSet(ex)}>
                <View>
                  <Text style={styles.pickerItemName}>{ex.name}</Text>
                  <Text style={styles.pickerItemCat}>{ex.category}{ex.isCardio ? ' · Cardio' : ''}</Text>
                </View>
                <Text style={{ color: accentColor, fontSize: 18 }}>＋</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Card>
  );
}

// ─── SetRow ───────────────────────────────────────────────────────
interface SetRowProps {
  set: WorkoutSet;
  index: number;
  isCardio: boolean;
  accentColor: string;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onDelete: () => void;
}

function SetRow({ set, index, isCardio, accentColor, onUpdate, onDelete }: SetRowProps) {
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));
  const [duration, setDuration] = useState(String(Math.floor((set.duration ?? 0) / 60)));
  const [distance, setDistance] = useState(String(set.distance ?? 0));

  function commit() {
    if (isCardio) {
      onUpdate({ duration: (parseFloat(duration) || 0) * 60, distance: parseFloat(distance) || 0 });
    } else {
      onUpdate({ weight: parseFloat(weight) || 0, reps: parseInt(reps) || 0 });
    }
  }

  function toggle() {
    onUpdate({ isCompleted: !set.isCompleted });
  }

  return (
    <View style={[styles.setRow, set.isCompleted && { backgroundColor: accentColor + '12' }]}>
      <Text style={styles.setIndex}>{index + 1}</Text>
      {isCardio ? (
        <>
          <TextInput style={styles.setInput} value={duration} onChangeText={setDuration} onBlur={commit} keyboardType="decimal-pad" placeholder="min" />
          <Text style={styles.setUnit}>min</Text>
          <TextInput style={styles.setInput} value={distance} onChangeText={setDistance} onBlur={commit} keyboardType="decimal-pad" placeholder="mi" />
          <Text style={styles.setUnit}>mi</Text>
        </>
      ) : (
        <>
          <TextInput style={styles.setInput} value={weight} onChangeText={setWeight} onBlur={commit} keyboardType="decimal-pad" placeholder="lbs" />
          <Text style={styles.setUnit}>lbs</Text>
          <TextInput style={styles.setInput} value={reps} onChangeText={setReps} onBlur={commit} keyboardType="number-pad" placeholder="reps" />
          <Text style={styles.setUnit}>reps</Text>
        </>
      )}
      <TouchableOpacity onPress={toggle} style={[styles.checkBtn, { borderColor: accentColor, backgroundColor: set.isCompleted ? accentColor : 'transparent' }]}>
        {set.isCompleted && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteSetBtn}>
        <Text style={styles.deleteSetBtnLabel}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessionName: { fontSize: 16, fontWeight: '700', color: Colors.label, flex: 1 },
  timer: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  completeBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  discardBtn: { color: Colors.secondaryLabel, fontSize: 18, padding: 4 },
  group: { gap: 6 },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  groupName: { fontSize: 14, fontWeight: '700', color: Colors.label },
  groupCategory: { fontSize: 11, color: Colors.secondaryLabel },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.secondaryBackground, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
  },
  setIndex: { width: 18, fontSize: 12, color: Colors.secondaryLabel, fontWeight: '700', textAlign: 'center' },
  setInput: { width: 50, fontSize: 15, fontWeight: '700', color: Colors.label, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: Colors.separator, paddingBottom: 2 },
  setUnit: { fontSize: 11, color: Colors.secondaryLabel, width: 26 },
  checkBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  deleteSetBtn: { padding: 2 },
  deleteSetBtnLabel: { color: Colors.tertiaryLabel, fontSize: 13 },
  addSetBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  addSetBtnLabel: { fontSize: 13, fontWeight: '700' },
  addExBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: AppLayout.cornerRadius, padding: 12, alignItems: 'center' },
  addExBtnLabel: { fontWeight: '700', fontSize: 15 },
  picker: { flex: 1, backgroundColor: '#fff' },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  pickerTitle: { fontSize: 17, fontWeight: '700' },
  pickerClose: { fontSize: 16, color: Colors.blue },
  pickerSearch: { margin: 12, padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 15 },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  pickerItemName: { fontSize: 15, color: Colors.label, fontWeight: '500' },
  pickerItemCat: { fontSize: 12, color: Colors.secondaryLabel },
});
