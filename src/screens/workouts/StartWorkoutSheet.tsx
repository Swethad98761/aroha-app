import React, { useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Exercise, WorkoutRoutine } from '../../db/database';
import { Colors, AppLayout } from '../../theme';
import { getFavouriteIds } from '../../db/stepTracker';

const MUSCLE_GROUPS = [
  { key: 'Chest',      emoji: '💪', color: '#FF5500' },
  { key: 'Back',       emoji: '🔙', color: '#007AFF' },
  { key: 'Shoulders',  emoji: '🏔',  color: '#DA70D6' },
  { key: 'Biceps',     emoji: '💪', color: '#34C759' },
  { key: 'Triceps',    emoji: '💪', color: '#00C7BE' },
  { key: 'Abs',        emoji: '⚡', color: '#FF9500' },
  { key: 'Quads',      emoji: '🦵', color: '#FF2D55' },
  { key: 'Hamstrings', emoji: '🦵', color: '#AF52DE' },
  { key: 'Glutes',     emoji: '🍑', color: '#5856D6' },
  { key: 'Calves',     emoji: '🦶', color: '#FF6B6B' },
  { key: 'Cardio',     emoji: '🏃', color: '#FF3B30' },
];


interface Props {
  routines: WorkoutRoutine[];
  exercises: Exercise[];
  accentColor: string;
  lastWorkoutName?: string;
  onClose: () => void;
  onStart: (name?: string, routine?: WorkoutRoutine, startExercise?: Exercise) => void;
}

export function StartWorkoutSheet({ routines, exercises, accentColor, lastWorkoutName, onClose, onStart }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const favouriteIds = getFavouriteIds();

  const favourites = useMemo(() =>
    exercises.filter(e => favouriteIds.includes(e.id)),
    [exercises, favouriteIds]
  );

  const groupExercises = useMemo(() =>
    selectedGroup ? exercises.filter(e => e.category === selectedGroup) : [],
    [exercises, selectedGroup]
  );

  function estMinutes(r: WorkoutRoutine): number {
    const sets = (r.routineExercises ?? []).reduce((a, re) => a + (re.targetSets || 3), 0) || (r.exercises?.length ?? 0) * 3;
    return Math.max(10, Math.round(sets * 2.5));
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 14 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Start workout</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeLabel}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* JUMP IN */}
        <Text style={styles.sectionLabel}>JUMP IN</Text>
        <View style={styles.jumpRow}>
          <TouchableOpacity style={styles.jumpCard} onPress={() => onStart()}>
            <Text style={[styles.jumpIcon, { color: accentColor }]}>⊕</Text>
            <Text style={styles.jumpTitle}>Empty workout</Text>
            <Text style={styles.jumpSub}>Freestyle, add as you go</Text>
          </TouchableOpacity>
          {lastWorkoutName ? (
            <TouchableOpacity style={styles.jumpCard} onPress={() => onStart(lastWorkoutName)}>
              <Text style={[styles.jumpIcon, { color: accentColor }]}>↻</Text>
              <Text style={styles.jumpTitle}>Repeat last</Text>
              <Text style={styles.jumpSub} numberOfLines={1}>{lastWorkoutName}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.jumpCard, { opacity: 0.4 }]}>
              <Text style={[styles.jumpIcon, { color: accentColor }]}>↻</Text>
              <Text style={styles.jumpTitle}>Repeat last</Text>
              <Text style={styles.jumpSub}>No history yet</Text>
            </View>
          )}
        </View>

        {/* MY ROUTINES */}
        {routines.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>MY ROUTINES</Text>
            <View style={{ gap: 8, marginBottom: 22 }}>
              {routines.map(r => {
                const count = r.routineExercises?.length ?? r.exercises?.length ?? 0;
                return (
                  <TouchableOpacity key={r.id} style={styles.routineRow} onPress={() => onStart(undefined, r)}>
                    <View style={[styles.routineIcon, { backgroundColor: accentColor + '1A' }]}>
                      <Image source={require('../../../assets/gada_silver.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.routineName}>{r.name}</Text>
                      <Text style={styles.routineMeta}>{count} exercise{count !== 1 ? 's' : ''} · ~{estMinutes(r)} min</Text>
                    </View>
                    <View style={[styles.playDot, { backgroundColor: accentColor }]}>
                      <Text style={{ color: '#fff', fontSize: 13 }}>▶</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* FAVOURITES */}
        {favourites.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>⭐ STARRED EXERCISES</Text>
            <View style={styles.favWrap}>
              {favourites.map(ex => {
                const grp = MUSCLE_GROUPS.find(g => g.key === ex.category);
                const c = grp?.color ?? accentColor;
                return (
                  <TouchableOpacity key={ex.id} style={[styles.favChip, { borderColor: c, backgroundColor: c + '12' }]} onPress={() => onStart(ex.name, undefined, ex)}>
                    <Text style={[styles.favChipLabel, { color: c }]}>{ex.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* BY MUSCLE GROUP */}
        <Text style={styles.sectionLabel}>BY MUSCLE GROUP</Text>
        <View style={styles.muscleGrid}>
          {MUSCLE_GROUPS.map(g => {
            const n = exercises.filter(e => e.category === g.key).length;
            if (n === 0) return null;
            const active = selectedGroup === g.key;
            return (
              <TouchableOpacity
                key={g.key}
                style={[styles.muscleCard, { borderColor: active ? g.color : '#EEE', backgroundColor: active ? g.color + '10' : '#fff' }]}
                onPress={() => setSelectedGroup(active ? null : g.key)}
              >
                <View style={[styles.muscleDot, { backgroundColor: g.color }]} />
                <Text style={[styles.muscleLabel, { color: active ? g.color : '#222' }]} numberOfLines={1}>{g.key}</Text>
                <Text style={styles.muscleCount}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Expanded exercise list */}
        {selectedGroup && groupExercises.length > 0 && (
          <View style={{ marginTop: 6 }}>
            {groupExercises.map(ex => {
              const isFav = favouriteIds.includes(ex.id);
              const c = MUSCLE_GROUPS.find(g => g.key === ex.category)?.color ?? accentColor;
              return (
                <TouchableOpacity key={ex.id} style={styles.exRow} onPress={() => onStart(ex.name, undefined, ex)}>
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{isFav ? '⭐' : '  '}</Text>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <View style={[styles.startDot, { backgroundColor: c }]}>
                    <Text style={{ color: '#fff', fontSize: 13 }}>▶</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
  closeLabel: { fontSize: 15, color: '#666', fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  jumpRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  jumpCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#E8E8E8', padding: 16 },
  jumpIcon: { fontSize: 24, fontWeight: '300', marginBottom: 8 },
  jumpTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 2 },
  jumpSub: { fontSize: 11, color: '#999' },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#E8E8E8', padding: 13 },
  routineIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  routineName: { fontSize: 15, fontWeight: '700', color: '#111' },
  routineMeta: { fontSize: 11.5, color: '#999', marginTop: 1 },
  playDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  favWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  favChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 13, borderWidth: 1 },
  favChipLabel: { fontSize: 13, fontWeight: '700' },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleCard: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 12 },
  muscleDot: { width: 10, height: 10, borderRadius: 5 },
  muscleLabel: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  muscleCount: { fontSize: 11, color: '#BBB', fontWeight: '700' },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  exName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#222' },
  startDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
