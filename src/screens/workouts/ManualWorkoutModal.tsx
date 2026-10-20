// src/screens/workouts/ManualWorkoutModal.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme } from '../../theme';
import { Exercise } from '../../db/database';

const ACCENT = AppTheme.workouts.accentColor;

interface Props { visible: boolean; onClose: () => void; }

interface PendingSet { exercise: Exercise; weight: number; reps: number; isCardio: boolean; duration: number; distance: number; }

export function ManualWorkoutModal({ visible, onClose }: Props) {
  const { exercises, startWorkoutSession, saveWorkoutSession, addWorkoutSet } = useAppStore();
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState('45');
  const [pendingSets, setPendingSets] = useState<PendingSet[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  function addSet(ex: Exercise) {
    setPendingSets([...pendingSets, { exercise: ex, weight: 45, reps: 10, isCardio: ex.isCardio, duration: 30, distance: 1 }]);
    setShowPicker(false);
    setSearch('');
  }

  function updateSet(idx: number, patch: Partial<PendingSet>) {
    setPendingSets(pendingSets.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }

  function removeSet(idx: number) {
    setPendingSets(pendingSets.filter((_, i) => i !== idx));
  }

  async function save() {
    const sessionName = name.trim() || `Workout on ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const session = await startWorkoutSession(sessionName);
    // Add all sets
    for (const ps of pendingSets) {
      await addWorkoutSet({
        exerciseId: ps.exercise.id,
        sessionId: session.id,
        weight: ps.weight,
        reps: ps.reps,
        isCompleted: true,
        duration: ps.isCardio ? ps.duration * 60 : null,
        distance: ps.isCardio ? ps.distance : null,
        overriddenNotes: null,
      });
    }
    await saveWorkoutSession({ id: session.id, isCompleted: true, duration: parseFloat(duration) * 60 || 0, name: sessionName });
    setPendingSets([]); setName(''); setDuration('45'); onClose();
  }

  const filteredEx = exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.title}>Log Manual Workout</Text>
          <TouchableOpacity onPress={save}><Text style={[styles.save, { color: ACCENT }]}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Field label="Name (optional)">
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Workout name" />
          </Field>
          <Field label="Date">
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
          </Field>
          <Field label="Duration (minutes)">
            <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="decimal-pad" />
          </Field>

          <Text style={styles.sectionLabel}>SETS</Text>
          {pendingSets.map((ps, idx) => (
            <View key={idx} style={styles.setCard}>
              <View style={styles.setCardHeader}>
                <Text style={styles.setCardName}>{ps.exercise.name}</Text>
                <TouchableOpacity onPress={() => removeSet(idx)}><Text style={styles.removeBtn}>✕</Text></TouchableOpacity>
              </View>
              {ps.isCardio ? (
                <View style={styles.setRow}>
                  <LabeledInput label="Duration (min)" value={String(ps.duration)} onChange={(v) => updateSet(idx, { duration: parseFloat(v) || 0 })} />
                  <LabeledInput label="Distance (mi)" value={String(ps.distance)} onChange={(v) => updateSet(idx, { distance: parseFloat(v) || 0 })} />
                </View>
              ) : (
                <View style={styles.setRow}>
                  <LabeledInput label="Weight (lbs)" value={String(ps.weight)} onChange={(v) => updateSet(idx, { weight: parseFloat(v) || 0 })} />
                  <LabeledInput label="Reps" value={String(ps.reps)} onChange={(v) => updateSet(idx, { reps: parseInt(v) || 0 })} />
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={[styles.addBtn, { borderColor: ACCENT }]} onPress={() => setShowPicker(true)}>
            <Text style={[styles.addBtnLabel, { color: ACCENT }]}>＋ Add Set</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal visible={showPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Pick Exercise</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.searchInput} placeholder="Search…" value={search} onChangeText={setSearch} autoFocus />
          <ScrollView>
            {filteredEx.map((ex) => (
              <TouchableOpacity key={ex.id} style={styles.pickRow} onPress={() => addSet(ex)}>
                <Text style={styles.pickName}>{ex.name}</Text>
                <Text style={styles.pickCat}>{ex.category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel, marginBottom: 4 }}>{label}</Text>
      {children}
    </View>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: Colors.secondaryLabel, marginBottom: 2 }}>{label}</Text>
      <TextInput style={styles.miniInput} value={value} onChangeText={onChange} keyboardType="decimal-pad" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  title: { fontSize: 17, fontWeight: '700' },
  cancel: { fontSize: 16, color: Colors.blue },
  save: { fontSize: 16, fontWeight: '700' },
  body: { padding: AppLayout.screenMargin },
  input: { borderBottomWidth: 1, borderBottomColor: Colors.separator, fontSize: 16, paddingBottom: 6, color: Colors.label },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  setCard: { backgroundColor: Colors.secondaryBackground, borderRadius: AppLayout.cornerRadius, padding: 12, marginBottom: 10 },
  setCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  setCardName: { fontSize: 14, fontWeight: '700', color: Colors.label },
  removeBtn: { color: Colors.secondaryLabel, fontSize: 16 },
  setRow: { flexDirection: 'row', gap: 16 },
  miniInput: { borderBottomWidth: 1, borderBottomColor: Colors.separator, fontSize: 18, fontWeight: '700', paddingBottom: 4, color: Colors.label },
  addBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: AppLayout.cornerRadius, padding: 14, alignItems: 'center', marginTop: 8 },
  addBtnLabel: { fontWeight: '700', fontSize: 15 },
  searchInput: { margin: 12, padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 15 },
  pickRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  pickName: { fontSize: 15, color: Colors.label },
  pickCat: { fontSize: 12, color: Colors.secondaryLabel, marginTop: 2 },
});
