import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme } from '../../theme';
import { Exercise, WorkoutRoutine } from '../../db/database';
import { getFavouriteIds, addFavourite, removeFavourite } from '../../db/stepTracker';

const ACCENT = AppTheme.workouts.accentColor;

const CATEGORIES = [
  { key: '⭐', label: '⭐ Saved', color: '#FFD700', bg: '#FFFBEA' },
  { key: 'All', label: 'All', color: '#666', bg: '#F5F5F5' },
  { key: 'Chest', label: 'Chest', color: '#FF5500', bg: '#FFF3EE' },
  { key: 'Back', label: 'Back', color: '#007AFF', bg: '#EEF5FF' },
  { key: 'Shoulders', label: 'Delts', color: '#DA70D6', bg: '#FBF0FB' },
  { key: 'Biceps', label: 'Biceps', color: '#34C759', bg: '#EDFAF1' },
  { key: 'Triceps', label: 'Triceps', color: '#00C7BE', bg: '#EDFAFA' },
  { key: 'Abs', label: 'Abs', color: '#FF9500', bg: '#FFF7EE' },
  { key: 'Quads', label: 'Quads', color: '#FF2D55', bg: '#FFF0F3' },
  { key: 'Hamstrings', label: 'Hams', color: '#AF52DE', bg: '#F7EFFD' },
  { key: 'Glutes', label: 'Glutes', color: '#5856D6', bg: '#F0EFFD' },
  { key: 'Calves', label: 'Calves', color: '#FF6B6B', bg: '#FFF0F0' },
  { key: 'Cardio', label: 'Cardio', color: '#FF3B30', bg: '#FFF0EF' },
];

interface Props { visible: boolean; onClose: () => void; }

export function ExerciseLibraryModal({ visible, onClose }: Props) {
  const { exercises, routines, addExercise, saveExercise, removeExercise, addRoutine, saveRoutine, removeRoutine, saveRoutineExercises, saveRoutineWithTargets } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [tab, setTab] = useState<'exercises' | 'routines'>('exercises');
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [showAddEx, setShowAddEx] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Chest');
  const [newCardio, setNewCardio] = useState(false);
  const [editEx, setEditEx] = useState<Exercise | null>(null);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [editRoutine, setEditRoutine] = useState<WorkoutRoutine | null>(null);
  // Per-exercise targets while editing a routine: exId -> {sets,reps,weight}
  const [routineTargets, setRoutineTargets] = useState<Record<string, { sets: number; reps: number; weight: number }>>({});

  useEffect(() => {
    if (visible) setFavouriteIds(getFavouriteIds());
  }, [visible]);

  function toggleFavourite(exId: string) {
    if (favouriteIds.includes(exId)) {
      removeFavourite(exId);
      setFavouriteIds(prev => prev.filter(id => id !== exId));
    } else {
      addFavourite(exId);
      setFavouriteIds(prev => [exId, ...prev]);
    }
  }

  const filtered = useMemo(() => {
    let list = exercises;
    if (search) {
      // Generic search across all categories
      list = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    } else if (selectedCat === '⭐') {
      list = exercises.filter(e => favouriteIds.includes(e.id));
      list = [...list].sort((a, b) => favouriteIds.indexOf(a.id) - favouriteIds.indexOf(b.id));
    } else if (selectedCat !== 'All') {
      list = list.filter(e => e.category === selectedCat);
    }
    return list;
  }, [exercises, search, selectedCat, favouriteIds]);

  const activeCat = CATEGORIES.find(c => c.key === selectedCat) ?? CATEGORIES[1];

  function handleAddExercise() {
    if (!newName.trim()) return;
    addExercise(newName.trim(), newCat, newCardio);
    setNewName(''); setNewCat('Chest'); setNewCardio(false); setShowAddEx(false);
  }

  function openRoutine(r: WorkoutRoutine) {
    const targets: Record<string, { sets: number; reps: number; weight: number }> = {};
    (r.routineExercises ?? []).forEach(re => {
      targets[re.exercise.id] = { sets: re.targetSets, reps: re.targetReps, weight: re.targetWeight };
    });
    setRoutineTargets(targets);
    setEditRoutine({ ...r });
  }

  function toggleRoutineExercise(exId: string) {
    if (!editRoutine) return;
    const current = editRoutine.exercises?.map(e => e.id) ?? [];
    const next = current.includes(exId) ? current.filter(id => id !== exId) : [...current, exId];
    setRoutineTargets(prev => {
      const copy = { ...prev };
      if (next.includes(exId)) { if (!copy[exId]) copy[exId] = { sets: 3, reps: 10, weight: 0 }; }
      else { delete copy[exId]; }
      return copy;
    });
    setEditRoutine({ ...editRoutine, exercises: exercises.filter(e => next.includes(e.id)) });
  }

  function setTarget(exId: string, field: 'sets' | 'reps' | 'weight', value: number) {
    setRoutineTargets(prev => ({ ...prev, [exId]: { ...(prev[exId] ?? { sets: 3, reps: 10, weight: 0 }), [field]: value } }));
  }

  function saveRoutineEdits() {
    if (!editRoutine) return;
    const ids = editRoutine.exercises?.map(e => e.id) ?? [];
    const items = ids.map(id => ({ exerciseId: id, sets: routineTargets[id]?.sets ?? 3, reps: routineTargets[id]?.reps ?? 10, weight: routineTargets[id]?.weight ?? 0 }));
    saveRoutineWithTargets(editRoutine.id, items);
    saveRoutine(editRoutine.id, editRoutine.name);
    setEditRoutine(null);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {(['exercises', 'routines'] as const).map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]} onPress={() => setTab(t)}>
              <Text style={[styles.tabLabel, tab === t && { color: ACCENT }]}>{t === 'exercises' ? 'Exercises' : 'Routines'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'exercises' ? (
          <>
            <TextInput style={styles.search} placeholder="Search exercises…" value={search} onChangeText={setSearch} placeholderTextColor={Colors.tertiaryLabel} />

            {/* Category chips — colored & clear */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}>
              {CATEGORIES.map(c => {
                const active = selectedCat === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setSelectedCat(c.key)}
                    activeOpacity={0.7}
                    style={{
                      flexShrink: 0,
                      minWidth: 64,
                      height: 34,
                      paddingHorizontal: 16,
                      borderRadius: 17,
                      backgroundColor: active ? c.color : c.color + '22',
                      borderWidth: 1.5,
                      borderColor: c.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, fontWeight: '800', color: active ? '#FFFFFF' : c.color }}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active category header */}
            <View style={[styles.catHeader, { backgroundColor: activeCat.bg, borderLeftColor: activeCat.color }]}>
              <Text style={[styles.catHeaderText, { color: activeCat.color }]}>
                {activeCat.label} · {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Favourites empty hint */}
            {selectedCat === '⭐' && filtered.length === 0 && (
              <View style={styles.favHint}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>☆</Text>
                <Text style={styles.favHintText}>Tap ☆ next to any exercise to save it here</Text>
              </View>
            )}

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
              {filtered.map(ex => {
                const isFav = favouriteIds.includes(ex.id);
                const catColor = CATEGORIES.find(c => c.key === ex.category)?.color ?? '#888';
                return (
                  <TouchableOpacity key={ex.id} style={styles.exRow} onPress={() => setEditEx({ ...ex })}>
                    <TouchableOpacity onPress={() => toggleFavourite(ex.id)} style={styles.starBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={[styles.star, isFav && styles.starActive]}>{isFav ? '⭐' : '☆'}</Text>
                    </TouchableOpacity>
                    <View style={styles.exLeft}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <View style={[styles.catTag, { backgroundColor: catColor + '15' }]}>
                        <Text style={[styles.catTagLabel, { color: catColor }]}>{ex.category}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert('Delete?', ex.name, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => removeExercise(ex.id) }
                    ])}>
                      <Text style={styles.deleteBtn}>🗑</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.fab, { backgroundColor: ACCENT }]} onPress={() => setShowAddEx(true)}>
              <Text style={styles.fabLabel}>＋ Add Exercise</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={{ padding: AppLayout.screenMargin, gap: 12, paddingBottom: 100 }}>
              {routines.length === 0 && <Text style={styles.empty}>No routines yet.</Text>}
              {routines.map(r => (
                <TouchableOpacity key={r.id} style={styles.routineRow} onPress={() => openRoutine(r)}>
                  <View>
                    <Text style={styles.routineName}>{r.name}</Text>
                    <Text style={styles.routineMeta}>{r.exercises?.length ?? 0} exercises</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Delete?', '', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => removeRoutine(r.id) }
                  ])}>
                    <Text style={styles.deleteBtn}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.fab, { backgroundColor: ACCENT }]} onPress={() => setShowAddRoutine(true)}>
              <Text style={styles.fabLabel}>＋ New Routine</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Add Exercise */}
        <Modal visible={showAddEx} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAddEx(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowAddEx(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.sheetTitle}>New Exercise</Text>
              <TouchableOpacity onPress={handleAddExercise}><Text style={[styles.saveBtn2, { color: ACCENT }]}>Add</Text></TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.fieldInput} value={newName} onChangeText={setNewName} placeholder="Exercise name" autoFocus placeholderTextColor={Colors.tertiaryLabel} />
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {CATEGORIES.filter(c => c.key !== 'All' && c.key !== '⭐').map(c => (
                  <TouchableOpacity key={c.key}
                    style={[styles.catChip, { backgroundColor: newCat === c.key ? c.color : c.bg, borderColor: c.color + '60' }]}
                    onPress={() => setNewCat(c.key)}
                  >
                    <Text style={[styles.catChipLabel, { color: newCat === c.key ? '#fff' : c.color }]}>{c.label}</Text>
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

        {/* Edit Exercise */}
        <Modal visible={!!editEx} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setEditEx(null)}>
          {editEx && (
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setEditEx(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
                <Text style={styles.sheetTitle}>Edit</Text>
                <TouchableOpacity onPress={() => { saveExercise(editEx); setEditEx(null); }}><Text style={[styles.saveBtn2, { color: ACCENT }]}>Save</Text></TouchableOpacity>
              </View>
              <View style={styles.sheetBody}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.fieldInput} value={editEx.name} onChangeText={t => setEditEx({ ...editEx, name: t })} placeholderTextColor={Colors.tertiaryLabel} />
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notes</Text>
                <TextInput style={[styles.fieldInput, { height: 80 }]} value={editEx.customNotes} onChangeText={t => setEditEx({ ...editEx, customNotes: t })} multiline placeholder="Custom notes…" placeholderTextColor={Colors.tertiaryLabel} />
              </View>
            </View>
          )}
        </Modal>

        {/* Add Routine */}
        <Modal visible={showAddRoutine} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAddRoutine(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowAddRoutine(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.sheetTitle}>New Routine</Text>
              <TouchableOpacity onPress={() => { if (!routineName.trim()) return; addRoutine(routineName.trim()); setRoutineName(''); setShowAddRoutine(false); }}>
                <Text style={[styles.saveBtn2, { color: ACCENT }]}>Create</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>Routine Name</Text>
              <TextInput style={styles.fieldInput} value={routineName} onChangeText={setRoutineName} placeholder="e.g. Push Day" autoFocus placeholderTextColor={Colors.tertiaryLabel} />
            </View>
          </View>
        </Modal>

        {/* Edit Routine */}
        <Modal visible={!!editRoutine} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditRoutine(null)}>
          {editRoutine && (
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setEditRoutine(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
                <Text style={styles.sheetTitle}>{editRoutine.name}</Text>
                <TouchableOpacity onPress={saveRoutineEdits}>
                  <Text style={[styles.saveBtn2, { color: ACCENT }]}>Save</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={{ fontSize: 12, color: '#999', paddingHorizontal: 16, paddingTop: 10 }}>Tap to add exercises, then set targets for each.</Text>
                {exercises.map(ex => {
                  const included = editRoutine.exercises?.some(e => e.id === ex.id);
                  const isFav = favouriteIds.includes(ex.id);
                  const catColor = CATEGORIES.find(c => c.key === ex.category)?.color ?? '#888';
                  const t = routineTargets[ex.id] ?? { sets: 3, reps: 10, weight: 0 };
                  return (
                    <View key={ex.id} style={{ borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}>
                      <TouchableOpacity style={styles.routineExRow} onPress={() => toggleRoutineExercise(ex.id)}>
                        <View style={[styles.checkbox, included && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
                          {included && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                        </View>
                        <Text style={[styles.routineExName, included && { color: ACCENT }]}>{ex.name}</Text>
                        {isFav && <Text style={{ fontSize: 12 }}>⭐</Text>}
                        <View style={[styles.catTag, { backgroundColor: catColor + '15' }]}>
                          <Text style={[styles.catTagLabel, { color: catColor }]}>{ex.category}</Text>
                        </View>
                      </TouchableOpacity>
                      {/* Set targets — only when included */}
                      {included && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingLeft: 42 }}>
                          {ex.isCardio || ex.isTimed ? (
                            <View style={styles.targetCol}>
                              <Text style={styles.targetLabel}>{ex.isTimed ? 'SETS' : 'SETS'}</Text>
                              <TextInput style={styles.targetInput} keyboardType="number-pad" value={String(t.sets)} onChangeText={(v) => setTarget(ex.id, 'sets', parseInt(v) || 0)} />
                            </View>
                          ) : (
                            <>
                              <View style={styles.targetCol}>
                                <Text style={styles.targetLabel}>SETS</Text>
                                <TextInput style={styles.targetInput} keyboardType="number-pad" value={String(t.sets)} onChangeText={(v) => setTarget(ex.id, 'sets', parseInt(v) || 0)} />
                              </View>
                              <Text style={{ color: '#CCC', marginTop: 14 }}>×</Text>
                              <View style={styles.targetCol}>
                                <Text style={styles.targetLabel}>REPS</Text>
                                <TextInput style={styles.targetInput} keyboardType="number-pad" value={String(t.reps)} onChangeText={(v) => setTarget(ex.id, 'reps', parseInt(v) || 0)} />
                              </View>
                              <View style={styles.targetCol}>
                                <Text style={styles.targetLabel}>LBS</Text>
                                <TextInput style={styles.targetInput} keyboardType="decimal-pad" value={String(t.weight)} onChangeText={(v) => setTarget(ex.id, 'weight', parseFloat(v) || 0)} />
                              </View>
                            </>
                          )}
                        </View>
                      )}
                    </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, paddingTop: 64, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  title: { fontSize: 18, fontWeight: '700', color: Colors.label },
  done: { fontSize: 16, color: Colors.blue },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.separator },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 15, fontWeight: '600', color: Colors.secondaryLabel },
  search: { margin: 12, padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 15, color: Colors.label },
  catScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catChipLabel: { fontSize: 13, fontWeight: '700' },
  catHeader: { paddingHorizontal: 16, paddingVertical: 8, borderLeftWidth: 3, marginHorizontal: 12, marginVertical: 6, borderRadius: 4 },
  catHeaderText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  favHint: { alignItems: 'center', padding: 40 },
  favHintText: { fontSize: 14, color: Colors.secondaryLabel, textAlign: 'center' },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  starBtn: { width: 28, alignItems: 'center' },
  star: { fontSize: 18, color: '#CCC' },
  starActive: { color: '#FFD700' },
  exLeft: { flex: 1, gap: 4 },
  exName: { fontSize: 15, fontWeight: '600', color: Colors.label },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  catTagLabel: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { fontSize: 18, padding: 4, opacity: 0.5 },
  empty: { color: Colors.secondaryLabel, fontSize: 15, textAlign: 'center', marginTop: 40 },
  routineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8F8F8', borderRadius: 12 },
  routineName: { fontSize: 16, fontWeight: '700', color: Colors.label },
  targetCol: { alignItems: 'center', gap: 3 },
  targetLabel: { fontSize: 9, fontWeight: '800', color: '#BBB', letterSpacing: 0.5 },
  targetInput: { width: 52, height: 34, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#333' },
  routineMeta: { fontSize: 12, color: Colors.secondaryLabel },
  fab: { position: 'absolute', bottom: 20, left: 16, right: 16, padding: 15, borderRadius: 14, alignItems: 'center' },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sheet: { flex: 1, backgroundColor: '#fff' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: Colors.label },
  cancel: { fontSize: 16, color: Colors.blue },
  saveBtn2: { fontSize: 16, fontWeight: '600' },
  sheetBody: { padding: AppLayout.screenMargin, gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel, letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { fontSize: 16, borderBottomWidth: 1, borderBottomColor: Colors.separator, paddingBottom: 8, color: Colors.label },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.separator, padding: 2 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  routineExRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.separator, alignItems: 'center', justifyContent: 'center' },
  routineExName: { flex: 1, fontSize: 15, color: Colors.label },
});
