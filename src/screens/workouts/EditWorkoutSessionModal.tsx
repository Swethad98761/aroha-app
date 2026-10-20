// src/screens/workouts/EditWorkoutSessionModal.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { WorkoutSession } from '../../db/database';
import { AppLayout, Colors, AppTheme } from '../../theme';
import { formatTime } from '../../utils';

const ACCENT = AppTheme.workouts.accentColor;

interface Props { session: WorkoutSession; onClose: () => void; }

export function EditWorkoutSessionModal({ session, onClose }: Props) {
  const { exercises, saveWorkoutSession, removeWorkoutSession, saveWorkoutSet, removeWorkoutSet, addWorkoutSet, workoutSessions } = useAppStore();
  const live = workoutSessions.find((s) => s.id === session.id) ?? session;
  const [name, setName] = useState(live.name);
  const [duration, setDuration] = useState(String(Math.round(live.duration / 60)));

  function save() {
    saveWorkoutSession({ id: session.id, name, duration: parseFloat(duration) * 60 || live.duration });
    onClose();
  }

  function deleteSession() {
    Alert.alert('Delete Workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removeWorkoutSession(session.id); onClose(); } },
    ]);
  }

  const sets = live.sets ?? [];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.title}>Edit Workout</Text>
          <TouchableOpacity onPress={save}><Text style={[styles.save, { color: ACCENT }]}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Duration (minutes)</Text>
            <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="decimal-pad" />
          </View>

          <Text style={styles.sectionLabel}>SETS ({sets.length})</Text>
          {sets.map((set, idx) => {
            const ex = exercises.find((e) => e.id === set.exerciseId);
            return (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setNum}>{idx + 1}</Text>
                <View style={styles.setInfo}>
                  <Text style={styles.setExName}>{ex?.name ?? 'Unknown'}</Text>
                  {ex?.isCardio ? (
                    <Text style={styles.setDetail}>{Math.round((set.duration ?? 0) / 60)} min · {set.distance ?? 0} mi</Text>
                  ) : (
                    <Text style={styles.setDetail}>{set.weight} lbs × {set.reps} reps</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removeWorkoutSet(set.id)}>
                  <Text style={styles.deleteBtn}>🗑</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity style={styles.deleteSessionBtn} onPress={deleteSession}>
            <Text style={styles.deleteSessionLabel}>🗑 Delete Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  title: { fontSize: 17, fontWeight: '700' },
  cancel: { fontSize: 16, color: Colors.blue },
  save: { fontSize: 16, fontWeight: '700' },
  body: { padding: AppLayout.screenMargin, gap: 12 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel },
  input: { borderBottomWidth: 1, borderBottomColor: Colors.separator, fontSize: 16, paddingBottom: 6, color: Colors.label },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1, marginTop: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  setNum: { width: 24, fontSize: 13, color: Colors.secondaryLabel, fontWeight: '700', textAlign: 'center' },
  setInfo: { flex: 1 },
  setExName: { fontSize: 14, fontWeight: '600', color: Colors.label },
  setDetail: { fontSize: 12, color: Colors.secondaryLabel },
  deleteBtn: { fontSize: 18 },
  deleteSessionBtn: { marginTop: 24, padding: 14, backgroundColor: '#FF3B3010', borderRadius: AppLayout.cornerRadius, alignItems: 'center' },
  deleteSessionLabel: { color: Colors.red, fontWeight: '700', fontSize: 15 },
});
