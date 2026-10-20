// src/screens/focus/FocusScreen.tsx

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Ellipse, Path, G, Circle, Rect } from 'react-native-svg';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme, cardStyle } from '../../theme';
import { TechLogoHeader, Card } from '../../components/SharedComponents';
import { getCurrentWeekDays, isSameDay2, formatDateShort, formatTime } from '../../utils';
import { WorkoutSession, YogaSession, MeditationSession } from '../../db/database';

const ACCENT = AppTheme.workouts.accentColor;
const { width: SCREEN_W } = Dimensions.get('window');

// Muscle group → color mapping
const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#FF6B6B',
  Back: '#4ECDC4',
  Shoulders: '#45B7D1',
  Biceps: '#96CEB4',
  Triceps: '#FECA57',
  Abs: '#FF9FF3',
  Quads: '#54A0FF',
  Hamstrings: '#5F27CD',
  Glutes: '#C44569',
  Calves: '#00D2D3',
  Cardio: '#FF9F43',
};

export default function FocusScreen() {
  const { workoutSessions, meditationSessions, yogaSessions } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const weekDays = getCurrentWeekDays();

  // Weekly volume in minutes
  const weeklyStrengthMins = useMemo(() => {
    const s = workoutSessions.filter((ws) => weekDays.some((wd) => isSameDay2(ws.date, wd)));
    return s.reduce((sum, ws) => sum + ws.duration, 0) / 60;
  }, [workoutSessions, weekDays]);

  const weeklyYogaMins = useMemo(() => {
    return yogaSessions.filter((ys) => weekDays.some((wd) => isSameDay2(ys.date, wd))).reduce((sum, ys) => sum + ys.duration, 0) / 60;
  }, [yogaSessions, weekDays]);

  const weeklyMedMins = useMemo(() => {
    return meditationSessions.filter((ms) => weekDays.some((wd) => isSameDay2(ms.date, wd)) && ms.isCompleted).reduce((sum, ms) => sum + ms.duration, 0) / 60;
  }, [meditationSessions, weekDays]);

  // Sessions on selected date
  const selectedWorkouts = workoutSessions.filter((ws) => isSameDay2(ws.date, selectedDate));
  const selectedMeditation = meditationSessions.filter((ms) => isSameDay2(ms.date, selectedDate) && ms.isCompleted);
  const selectedYoga = yogaSessions.filter((ys) => isSameDay2(ys.date, selectedDate));

  // Muscle groups worked on selected date
  const activeMuscles = useMemo(() => {
    const sets = selectedWorkouts.flatMap((ws) => ws.sets ?? []);
    const cats = sets.filter((s) => !s.exercise?.isCardio).map((s) => s.exercise?.category).filter(Boolean) as string[];
    return new Set(cats);
  }, [selectedWorkouts]);

  // Date strip: -30 to +7 days
  const dateStrip = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 38 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 30 + i);
      return d;
    });
  }, []);

  const hasActivity = (date: Date) => workoutSessions.some((ws) => isSameDay2(ws.date, date)) || yogaSessions.some((ys) => isSameDay2(ys.date, date)) || meditationSessions.some((ms) => isSameDay2(ms.date, date) && ms.isCompleted);

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <TechLogoHeader title="Focus Dashboard" accentColor={ACCENT} />
      <View style={styles.inner}>

        {/* Weekly Volume Chart */}
        <Card>
          <Text style={styles.cardTitle}>Weekly Practice Volume</Text>
          <View style={styles.barSection}>
            <VolumeBar label="Strength" icon="🏋️" minutes={weeklyStrengthMins} maxMinutes={180} color={AppTheme.workouts.accentColor} />
            <VolumeBar label="Yoga" icon="🧘" minutes={weeklyYogaMins} maxMinutes={120} color={AppTheme.yoga.accentColor} />
            <VolumeBar label="Meditation" icon="🧠" minutes={weeklyMedMins} maxMinutes={90} color={AppTheme.meditation.accentColor} />
          </View>
        </Card>

        {/* Date strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {dateStrip.map((date, idx) => {
            const isSelected = isSameDay2(date, selectedDate);
            const isToday = isSameDay2(date, new Date());
            const hasAct = hasActivity(date);
            return (
              <TouchableOpacity key={idx} style={[styles.dateCell, isSelected && { backgroundColor: ACCENT }]} onPress={() => setSelectedDate(date)}>
                <Text style={[styles.dateDayLabel, isSelected ? { color: '#fff' } : { color: Colors.secondaryLabel }]}>
                  {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                </Text>
                <Text style={[styles.dateDayNum, isSelected ? { color: '#fff' } : { color: Colors.label }]}>
                  {date.getDate()}
                </Text>
                <View style={[styles.dateDot, { backgroundColor: hasAct ? (isSelected ? '#fff' : ACCENT) : 'transparent' }]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Anatomy */}
        <Card>
          <Text style={styles.cardTitle}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <View style={styles.anatomyRow}>
            <AnatomyFigureFront activeMuscles={activeMuscles} selectedMuscle={selectedMuscle} onTap={(m) => setSelectedMuscle(selectedMuscle === m ? null : m)} />
            <AnatomyFigureBack activeMuscles={activeMuscles} selectedMuscle={selectedMuscle} onTap={(m) => setSelectedMuscle(selectedMuscle === m ? null : m)} />
          </View>

          {/* Activity summary */}
          {selectedWorkouts.length === 0 && selectedYoga.length === 0 && selectedMeditation.length === 0 ? (
            <Text style={styles.noActivity}>No activity logged on this day</Text>
          ) : (
            <View style={styles.activityList}>
              {selectedWorkouts.map((ws) => (
                <View key={ws.id} style={[styles.activityRow, { borderLeftColor: AppTheme.workouts.accentColor }]}>
                  <Text style={styles.activityName}>💪 {ws.name}</Text>
                  <Text style={styles.activityMeta}>{formatTime(ws.duration)} · {ws.sets?.filter((s) => s.isCompleted).length ?? 0} sets</Text>
                </View>
              ))}
              {selectedYoga.map((ys) => (
                <View key={ys.id} style={[styles.activityRow, { borderLeftColor: AppTheme.yoga.accentColor }]}>
                  <Text style={styles.activityName}>🧘 {ys.name}</Text>
                  <Text style={styles.activityMeta}>{formatTime(ys.duration)}</Text>
                </View>
              ))}
              {selectedMeditation.map((ms) => (
                <View key={ms.id} style={[styles.activityRow, { borderLeftColor: AppTheme.meditation.accentColor }]}>
                  <Text style={styles.activityName}>🧠 Meditation</Text>
                  <Text style={styles.activityMeta}>{formatTime(ms.duration)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Muscle breakdown */}
          {selectedMuscle && (
            <View style={[styles.muscleDetail, { borderColor: MUSCLE_COLORS[selectedMuscle] ?? ACCENT }]}>
              <Text style={[styles.muscleDetailTitle, { color: MUSCLE_COLORS[selectedMuscle] ?? ACCENT }]}>{selectedMuscle}</Text>
              {selectedWorkouts.flatMap((ws) => ws.sets?.filter((s) => s.exercise?.category === selectedMuscle && s.isCompleted) ?? []).map((s, i) => (
                <Text key={i} style={styles.muscleDetailRow}>
                  {s.exercise?.name}: {s.weight} lbs × {s.reps} reps
                </Text>
              ))}
            </View>
          )}
        </Card>

        {/* Active muscles legend */}
        {activeMuscles.size > 0 && (
          <Card>
            <Text style={styles.cardTitle}>Muscles Worked</Text>
            <View style={styles.legend}>
              {Array.from(activeMuscles).map((m) => (
                <TouchableOpacity key={m} style={[styles.legendChip, { backgroundColor: (MUSCLE_COLORS[m] ?? ACCENT) + '20', borderColor: MUSCLE_COLORS[m] ?? ACCENT }]} onPress={() => setSelectedMuscle(selectedMuscle === m ? null : m)}>
                  <Text style={[styles.legendLabel, { color: MUSCLE_COLORS[m] ?? ACCENT }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Volume Bar ───────────────────────────────────────────────────
function VolumeBar({ label, icon, minutes, maxMinutes, color }: { label: string; icon: string; minutes: number; maxMinutes: number; color: string }) {
  const fraction = Math.min(minutes / maxMinutes, 1);
  const barW = (SCREEN_W - AppLayout.screenMargin * 2 - AppLayout.cardPadding * 2 - 80) * fraction;

  return (
    <View style={styles.barRow}>
      <Text style={styles.barIcon}>{icon}</Text>
      <View style={styles.barTrackWrap}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: barW, backgroundColor: color }]} />
        </View>
        <Text style={styles.barLabel}>{label}</Text>
      </View>
      <Text style={[styles.barMins, { color }]}>{Math.round(minutes)}m</Text>
    </View>
  );
}

// ─── Anatomy Figures ──────────────────────────────────────────────
const FIGURE_W = 90;
const FIGURE_H = 200;

function AnatomyFigureFront({ activeMuscles, selectedMuscle, onTap }: { activeMuscles: Set<string>; selectedMuscle: string | null; onTap: (m: string) => void }) {
  function color(muscle: string) {
    if (!activeMuscles.has(muscle)) return '#E0E0E0';
    return selectedMuscle === muscle ? MUSCLE_COLORS[muscle] ?? ACCENT : (MUSCLE_COLORS[muscle] ?? ACCENT) + 'AA';
  }

  return (
    <Svg width={FIGURE_W} height={FIGURE_H} viewBox="0 0 90 200">
      {/* Head */}
      <Ellipse cx="45" cy="14" rx="13" ry="14" fill="#D4A574" />
      {/* Neck */}
      <Rect x="39" y="26" width="12" height="10" fill="#D4A574" />
      {/* Chest */}
      <Path d="M25,36 Q45,32 65,36 L68,72 Q45,76 22,72 Z" fill={color('Chest')} onPress={() => onTap('Chest')} />
      {/* Abs */}
      <Path d="M29,72 Q45,76 61,72 L58,105 Q45,108 32,105 Z" fill={color('Abs')} onPress={() => onTap('Abs')} />
      {/* Left Shoulder */}
      <Ellipse cx="18" cy="42" rx="10" ry="12" fill={color('Shoulders')} onPress={() => onTap('Shoulders')} />
      {/* Right Shoulder */}
      <Ellipse cx="72" cy="42" rx="10" ry="12" fill={color('Shoulders')} onPress={() => onTap('Shoulders')} />
      {/* Left Bicep */}
      <Path d="M8,54 Q14,52 18,54 L19,80 Q13,82 8,80 Z" fill={color('Biceps')} onPress={() => onTap('Biceps')} />
      {/* Right Bicep */}
      <Path d="M72,54 Q76,52 82,54 L82,80 Q76,82 71,80 Z" fill={color('Biceps')} onPress={() => onTap('Biceps')} />
      {/* Left Tricep (front visible) */}
      <Path d="M5,80 Q10,78 15,80 L14,105 Q8,107 5,105 Z" fill={color('Triceps')} onPress={() => onTap('Triceps')} />
      {/* Right Tricep */}
      <Path d="M75,80 Q80,78 85,80 L85,105 Q80,107 76,105 Z" fill={color('Triceps')} onPress={() => onTap('Triceps')} />
      {/* Left Quad */}
      <Path d="M30,108 Q44,110 45,110 L44,155 Q36,157 28,155 Z" fill={color('Quads')} onPress={() => onTap('Quads')} />
      {/* Right Quad */}
      <Path d="M46,110 Q58,110 60,108 L62,155 Q54,157 46,155 Z" fill={color('Quads')} onPress={() => onTap('Quads')} />
      {/* Left Calf */}
      <Path d="M30,157 Q36,155 41,157 L40,188 Q35,190 30,188 Z" fill={color('Calves')} onPress={() => onTap('Calves')} />
      {/* Right Calf */}
      <Path d="M49,157 Q54,155 60,157 L60,188 Q55,190 50,188 Z" fill={color('Calves')} onPress={() => onTap('Calves')} />
    </Svg>
  );
}

function AnatomyFigureBack({ activeMuscles, selectedMuscle, onTap }: { activeMuscles: Set<string>; selectedMuscle: string | null; onTap: (m: string) => void }) {
  function color(muscle: string) {
    if (!activeMuscles.has(muscle)) return '#E0E0E0';
    return selectedMuscle === muscle ? MUSCLE_COLORS[muscle] ?? ACCENT : (MUSCLE_COLORS[muscle] ?? ACCENT) + 'AA';
  }

  return (
    <Svg width={FIGURE_W} height={FIGURE_H} viewBox="0 0 90 200">
      {/* Head */}
      <Ellipse cx="45" cy="14" rx="13" ry="14" fill="#D4A574" />
      {/* Neck */}
      <Rect x="39" y="26" width="12" height="10" fill="#D4A574" />
      {/* Back / Lats */}
      <Path d="M25,36 Q45,32 65,36 L68,72 Q45,76 22,72 Z" fill={color('Back')} onPress={() => onTap('Back')} />
      {/* Lower back */}
      <Path d="M29,72 Q45,76 61,72 L58,100 Q45,103 32,100 Z" fill={color('Back')} onPress={() => onTap('Back')} />
      {/* Left Shoulder (rear) */}
      <Ellipse cx="18" cy="42" rx="10" ry="12" fill={color('Shoulders')} onPress={() => onTap('Shoulders')} />
      {/* Right Shoulder (rear) */}
      <Ellipse cx="72" cy="42" rx="10" ry="12" fill={color('Shoulders')} onPress={() => onTap('Shoulders')} />
      {/* Left Tricep */}
      <Path d="M8,54 Q14,52 19,54 L19,85 Q13,87 8,85 Z" fill={color('Triceps')} onPress={() => onTap('Triceps')} />
      {/* Right Tricep */}
      <Path d="M71,54 Q76,52 82,54 L82,85 Q76,87 71,85 Z" fill={color('Triceps')} onPress={() => onTap('Triceps')} />
      {/* Glutes */}
      <Path d="M28,100 Q45,104 62,100 L62,120 Q45,124 28,120 Z" fill={color('Glutes')} onPress={() => onTap('Glutes')} />
      {/* Left Hamstring */}
      <Path d="M29,120 Q37,122 43,120 L43,155 Q36,157 28,155 Z" fill={color('Hamstrings')} onPress={() => onTap('Hamstrings')} />
      {/* Right Hamstring */}
      <Path d="M47,120 Q53,122 61,120 L62,155 Q54,157 47,155 Z" fill={color('Hamstrings')} onPress={() => onTap('Hamstrings')} />
      {/* Left Calf (back) */}
      <Path d="M30,157 Q36,155 41,157 L40,188 Q35,190 30,188 Z" fill={color('Calves')} onPress={() => onTap('Calves')} />
      {/* Right Calf (back) */}
      <Path d="M49,157 Q54,155 60,157 L60,188 Q55,190 50,188 Z" fill={color('Calves')} onPress={() => onTap('Calves')} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  inner: { paddingHorizontal: AppLayout.screenMargin, gap: AppLayout.sectionSpacing },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.secondaryLabel, letterSpacing: 0.5, marginBottom: 12 },
  barSection: { gap: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barIcon: { fontSize: 18, width: 28 },
  barTrackWrap: { flex: 1, gap: 3 },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: Colors.secondaryBackground, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barLabel: { fontSize: 11, color: Colors.secondaryLabel, fontWeight: '600' },
  barMins: { fontSize: 12, fontWeight: '800', width: 36, textAlign: 'right' },
  dateStrip: { gap: 6, paddingHorizontal: AppLayout.screenMargin, paddingVertical: 4 },
  dateCell: { width: 44, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.cardBackground, gap: 2 },
  dateDayLabel: { fontSize: 9, fontWeight: '800' },
  dateDayNum: { fontSize: 16, fontWeight: '700' },
  dateDot: { width: 5, height: 5, borderRadius: 3 },
  anatomyRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  noActivity: { color: Colors.secondaryLabel, textAlign: 'center', fontSize: 14, marginTop: 8 },
  activityList: { gap: 8, marginTop: 12 },
  activityRow: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 4 },
  activityName: { fontSize: 14, fontWeight: '600', color: Colors.label },
  activityMeta: { fontSize: 12, color: Colors.secondaryLabel },
  muscleDetail: { marginTop: 12, borderWidth: 1, borderRadius: AppLayout.cornerRadius, padding: 12, gap: 4 },
  muscleDetailTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  muscleDetailRow: { fontSize: 13, color: Colors.secondaryLabel },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  legendLabel: { fontSize: 13, fontWeight: '700' },
});
