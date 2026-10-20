// src/screens/workouts/WorkoutStatsBar.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getWorkoutStats, shouldSuggestDeload, getNeglectedMuscles, getRepeatWorkoutSuggestion } from '../../db/workoutAnalytics';
import { formatTime } from '../../utils';
import { Colors } from '../../theme';

interface Props {
  accentColor: string;
  onRepeat: (name: string) => void;
}

export function WorkoutStatsBar({ accentColor, onRepeat }: Props) {
  const stats = useMemo(() => getWorkoutStats(), []);
  const deload = useMemo(() => shouldSuggestDeload(), []);
  const neglected = useMemo(() => getNeglectedMuscles(), []);
  const repeatName = useMemo(() => getRepeatWorkoutSuggestion(), []);

  return (
    <View style={styles.wrap}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatPill icon="🏋️" value={String(stats.totalWorkouts)} label="workouts" color={accentColor} />
        <StatPill icon="💪" value={String(stats.totalSets)} label="sets" color={accentColor} />
        <StatPill icon="🔥" value={`${stats.streak}d`} label="streak" color={stats.streak >= 3 ? Colors.green : accentColor} />
        <StatPill icon="⏱" value={formatTime(stats.totalDuration)} label="total" color={accentColor} />
      </View>

      {/* Smart suggestions */}
      {deload && (
        <TouchableOpacity
          style={[styles.suggestion, { backgroundColor: '#FF3B3010', borderColor: '#FF3B3030' }]}
          onPress={() => Alert.alert('Deload Week Suggested', "You've been training hard for 4+ weeks. A deload week (reduce weight by 40%, keep reps) will help you recover and come back stronger.", [{ text: 'Got it 🙏' }])}
        >
          <Text style={styles.suggestionIcon}>😴</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.suggestionTitle, { color: '#FF3B30' }]}>Deload Week Suggested</Text>
            <Text style={styles.suggestionSub}>4+ weeks of consistent training — your body needs rest</Text>
          </View>
          <Text style={styles.suggestionArrow}>›</Text>
        </TouchableOpacity>
      )}

      {neglected.length > 0 && (
        <View style={[styles.suggestion, { backgroundColor: accentColor + '08', borderColor: accentColor + '20' }]}>
          <Text style={styles.suggestionIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.suggestionTitle, { color: accentColor }]}>Neglected This Week</Text>
            <Text style={styles.suggestionSub}>{neglected.slice(0, 3).join(' · ')}</Text>
          </View>
        </View>
      )}

      {repeatName && (
        <TouchableOpacity
          style={[styles.suggestion, { backgroundColor: Colors.green + '08', borderColor: Colors.green + '25' }]}
          onPress={() => onRepeat(repeatName)}
        >
          <Text style={styles.suggestionIcon}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.suggestionTitle, { color: Colors.green }]}>Repeat Last Session</Text>
            <Text style={styles.suggestionSub}>{repeatName}</Text>
          </View>
          <Text style={styles.suggestionArrow}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatPill({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  statsRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  pillIcon: { fontSize: 16 },
  pillValue: { fontSize: 14, fontWeight: '900' },
  pillLabel: { fontSize: 9, color: Colors.secondaryLabel, fontWeight: '600' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, borderWidth: 1 },
  suggestionIcon: { fontSize: 20 },
  suggestionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  suggestionSub: { fontSize: 11, color: Colors.secondaryLabel },
  suggestionArrow: { fontSize: 18, color: Colors.tertiaryLabel },
});
