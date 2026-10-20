// src/screens/workouts/ExerciseLibraryModal.tsx

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  TextInput, Alert, SectionList,
} from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme } from '../../theme';
import { Exercise, WorkoutRoutine } from '../../db/database';

const ACCENT = AppTheme.workouts.accentColor;
const CATEGORIES = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Cardio', 'Other'];

interface Props { visible: boolean; onClose: () => void; }

export function ExerciseLibraryModal({ visible, onClose }: Props) {
  const { exercises, routines, addExercise, saveExercise, removeExercise, addRoutine, saveRoutine, removeRoutine, saveRoutineExercises } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [tab, setTab] = useState<'exercises' | 'routines'>('exercises');

  // Add Exercise
  const [showAddEx, setShowAddEx] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Chest');
  const [newCardio, setNewCardio] = useState(false);

  // Edit Exercise
  const [editEx, setEditEx] = useState<Exercise | null>(null);

  // Routines
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [editRoutine, setEditRoutine] = useState<WorkoutRoutine | null>(null);
  const [routinePickerEx, setRoutinePickerEx] = useState(false);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchCat = selectedCat === 'All' || e.category === selectedCat;
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [exercises, search, selectedCat]);

  function handleAddExercise() {
    if (!newName.trim()) return;
    addExercise(newName.trim(), newCat, newCardio);
    setNewName(''); setNewCat('Chest'); setNewCardio(false); setShowAddEx(false);
  }

  function handleSaveExercise() {
    if (!editEx) return;
    saveExercise(editEx);
    setEditEx(null);
  }

  function handleDeleteExercise(id: string) {
    Alert.alert('Delete Exercise?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeExercise(id) },
    ]);
  }

  function handleAddRoutine() {
    if (!routineName.trim()) return;
    addRoutine(routineName.trim());
    setRoutineName(''); setShowAddRoutine(false);
  }

  function handleSaveRoutine() {
    if (!editRoutine) return;
    saveRoutine(editRoutine.id, editRoutine.name);
    setEditRoutine(null);
  }

  function toggleRoutineExercise(exId: string) {
    if (!editRoutine) return;
    const current = editRoutine.exercises?.map((e) => e.id) ?? [];
    const next = current.includes(exId) ? current.filter((id) => id !== exId) : [...current, exId];
    saveRoutineExercises(editRoutine.id, next);
    const updatedExercises = exercises.filter((e) => next.includes(e.id));
    setEditRoutine({ ...editRoutine, exercises: updatedExercises });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['exercises', 'routines'] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]} onPress={() => setTab(t)}>
              <Text style={[styles.tabLabel, tab === t && { color: ACCENT }]}>{t === 'exercises' ? 'Exercises' : 'Routines'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'exercises' ? (
          <>
            <TextInput style={styles.search} placeholder="Search…" value={search} onChangeText={setSearch} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: AppLayout.screenMargin }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.catChip, selectedCat === c && { backgroundColor: ACCENT }]} onPress={() => setSelectedCat(c)}>
                  <Text style={[styles.catChipLabel, selectedCat === c && { color: '#fff' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {filtered.map((ex) => (
                <TouchableOpacity key={ex.id} style={styles.exRow} onPress={() => setEditEx({ ...ex })}>
                  <View style={styles.exLeft}>
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exMeta}>{ex.category}{ex.isCardio ? ' · Cardio' : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteExercise(ex.id)}>
                    <Text style={styles.deleteBtn}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.fab, { backgroundColor: ACCENT }]} onPress={() => setShowAddEx(true)}>
              <Text style={styles.fabLabel}>＋ Add Exercise</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={{ padding: AppLayout.screenMargin, gap: 12 }}>
              {routines.length === 0 && (
                <Text style={styles.empty}>No routines yet. Create one to pre-load workouts.</Text>
              )}
              {routines.map((r) => (
                <TouchableOpacity key={r.id} style={styles.routineRow} onPress={() => setEditRoutine({ ...r })}>
                  <View>
                    <Text style={styles.routineName}>{r.name}</Text>
                    <Text style={styles.routineMeta}>{r.exercises?.length ?? 0} exercises</Text>
                  </View>
                  <View style={styles.routineActions}>
                    <TouchableOpacity onPress={() => Alert.alert('Delete Routine?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeRoutine(r.id) }])}>
                      <Text style={styles.deleteBtn}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.fab, { backgroundColor: ACCENT }]} onPress={() => setShowAddRoutine(true)}>
              <Text style={styles.fabLabel}>＋ New Routine</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Add Exercise Sheet */}
        <Modal visible={showAddEx} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAddEx(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowAddEx(false)}><Text style={styles.sheetCancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.sheetTitle}>New Exercise</Text>
              <TouchableOpacity onPress={handleAddExercise}><Text style={[styles.sheetSave, { color: ACCENT }]}>Add</Text></TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.fieldInput} value={newName} onChangeText={setNewName} placeholder="Exercise name" autoFocus />
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <TouchableOpacity key={c} style={[styles.catChip, newCat === c && { backgroundColor: ACCENT }]} onPress={() => setNewCat(c)}>
                    <Text style={[styles.catChipLabel, newCat === c && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.toggleRow} onPress={() => setNewCardio(!newCardio)}>
                <Text style={styles.fieldLabel}>Cardio Exercise</Text>
                <View style={[styles.toggle, newCardio && { backgroundColor: ACCENT }]}>
                  <View style={[styles.toggleThumb, newCardio && { marginLeft: 18 }]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Exercise Sheet */}
        <Modal visible={!!editEx} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setEditEx(null)}>
          {editEx && (
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setEditEx(null)}><Text style={styles.sheetCancel}>Cancel</Text></TouchableOpacity>
                <Text style={styles.sheetTitle}>Edit Exercise</Text>
                <TouchableOpacity onPress={handleSaveExercise}><Text style={[styles.sheetSave, { color: ACCENT }]}>Save</Text></TouchableOpacity>
              </View>
              <View style={styles.sheetBody}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.fieldInput} value={editEx.name} onChangeText={(t) => setEditEx({ ...editEx, name: t })} />
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput style={[styles.fieldInput, { height: 80 }]} value={editEx.customNotes} onChangeText={(t) => setEditEx({ ...editEx, customNotes: t })} multiline placeholder="Custom notes…" />
              </View>
            </View>
          )}
        </Modal>

        {/* Add Routine Sheet */}
        <Modal visible={showAddRoutine} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAddRoutine(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowAddRoutine(false)}><Text style={styles.sheetCancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.sheetTitle}>New Routine</Text>
              <TouchableOpacity onPress={handleAddRoutine}><Text style={[styles.sheetSave, { color: ACCENT }]}>Create</Text></TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>Routine Name</Text>
              <TextInput style={styles.fieldInput} value={routineName} onChangeText={setRoutineName} placeholder="e.g. Push Day" autoFocus />
            </View>
          </View>
        </Modal>

        {/* Edit Routine Sheet */}
        <Modal visible={!!editRoutine} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditRoutine(null)}>
          {editRoutine && (
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setEditRoutine(null)}><Text style={styles.sheetCancel}>Done</Text></TouchableOpacity>
                <Text style={styles.sheetTitle}>{editRoutine.name}</Text>
                <TouchableOpacity onPress={handleSaveRoutine}><Text style={[styles.sheetSave, { color: ACCENT }]}>Save</Text></TouchableOpacity>
              </View>
              <TextInput style={styles.fieldInput} value={editRoutine.name} onChangeText={(t) => setEditRoutine({ ...editRoutine, name: t })} style={{ margin: 16, padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 16 }} />
              <Text style={styles.fieldLabel2}>EXERCISES IN ROUTINE</Text>
              <ScrollView>
                {exercises.map((ex) => {
                  const included = editRoutine.exercises?.some((e) => e.id === ex.id);
                  return (
                    <TouchableOpacity key={ex.id} style={styles.routineExRow} onPress={() => toggleRoutineExercise(ex.id)}>
                      <View style={[styles.checkbox, included && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
                        {included && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                      </View>
                      <Text style={styles.routineExName}>{ex.name}</Text>
                      <Text style={styles.routineExCat}>{ex.category}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  title: { fontSize: 18, fontWeight: '700' },
  done: { fontSize: 16, color: Colors.blue },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.separator },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 15, fontWeight: '600', color: Colors.secondaryLabel },
  search: { margin: 12, padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 15 },
  catScroll: { marginBottom: 8, maxHeight: 40 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.secondaryBackground },
  catChipLabel: { fontSize: 13, fontWeight: '600', color: Colors.secondaryLabel },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  exLeft: { flex: 1 },
  exName: { fontSize: 15, fontWeight: '500', color: Colors.label },
  exMeta: { fontSize: 12, color: Colors.secondaryLabel, marginTop: 2 },
  deleteBtn: { fontSize: 18, padding: 4 },
  empty: { color: Colors.secondaryLabel, fontSize: 15, textAlign: 'center', marginTop: 40 },
  routineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: Colors.secondaryBackground, borderRadius: AppLayout.cornerRadius },
  routineName: { fontSize: 16, fontWeight: '700' },
  routineMeta: { fontSize: 12, color: Colors.secondaryLabel },
  routineActions: { flexDirection: 'row', gap: 12 },
  fab: { margin: 16, padding: 14, borderRadius: AppLayout.cornerRadius, alignItems: 'center' },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sheet: { flex: 1, backgroundColor: '#fff' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  sheetTitle: { fontSize: 17, fontWeight: '600' },
  sheetCancel: { fontSize: 16, color: Colors.blue },
  sheetSave: { fontSize: 16, fontWeight: '600' },
  sheetBody: { padding: AppLayout.screenMargin, gap: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel, letterSpacing: 0.5, marginBottom: 4 },
  fieldLabel2: { fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1, margin: 16, marginBottom: 4 },
  fieldInput: { fontSize: 16, borderBottomWidth: 1, borderBottomColor: Colors.separator, paddingBottom: 8, color: Colors.label },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.separator, padding: 2 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  routineExRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.separator, alignItems: 'center', justifyContent: 'center' },
  routineExName: { flex: 1, fontSize: 15, color: Colors.label },
  routineExCat: { fontSize: 12, color: Colors.secondaryLabel },
});
