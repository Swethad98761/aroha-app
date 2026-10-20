// src/screens/focus/FocusScreen.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, Animated, Easing, Modal } from 'react-native';
import Svg, { Ellipse, Path, G, Circle, Rect } from 'react-native-svg';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme, cardStyle } from '../../theme';
import { TabHeader, Card } from '../../components/SharedComponents';
import { getCurrentWeekDays, isSameDay2, formatDateShort, formatTime } from '../../utils';
import { WorkoutSession, YogaSession, MeditationSession } from '../../db/database';
import { MEDITATION_TYPES } from '../../data/meditationData';
import { WeightCard } from './WeightCard';

const MED_EMOJI: Record<string, string> = Object.fromEntries(MEDITATION_TYPES.map(m => [m.id, m.emoji]));
const MED_NAME: Record<string, string> = Object.fromEntries(MEDITATION_TYPES.map(m => [m.id, m.name]));

const ACCENT = AppTheme.workouts.accentColor;
const { width: SCREEN_W } = Dimensions.get('window');

// Muscle group → color mapping
const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#FF5500',
  Back: '#007AFF',
  Shoulders: '#DA70D6',
  Biceps: '#34C759',
  Triceps: '#00C7BE',
  Abs: '#FF9500',
  Quads: '#FF2D55',
  Hamstrings: '#AF52DE',
  Glutes: '#5856D6',
  Calves: '#FF6B6B',
  Cardio: '#FF3B30',
};

export default function FocusScreen() {
  const { workoutSessions, meditationSessions, yogaSessions } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
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

  // Muscle groups worked — tracked per activity type
  const muscleActivity = useMemo(() => {
    // Workout muscles
    const workoutSets = selectedWorkouts.flatMap((ws) => ws.sets ?? []);
    const workoutMuscles = new Set(
      workoutSets.filter((s) => s.isCompleted && !s.exercise?.isCardio)
        .map((s) => s.exercise?.category).filter(Boolean) as string[]
    );

    // Yoga muscles — yoga works core, shoulders, hips, hamstrings, glutes
    const YOGA_MUSCLES = ['Abs', 'Shoulders', 'Hamstrings', 'Glutes', 'Back'];
    const yogaMuscles = new Set(selectedYoga.length > 0 ? YOGA_MUSCLES : []);

    // Meditation muscles — meditation relieves tension in shoulders, back, abs (diaphragm)
    const MEDITATION_MUSCLES = ['Shoulders', 'Back', 'Abs'];
    const meditationMuscles = new Set(selectedMeditation.length > 0 ? MEDITATION_MUSCLES : []);

    // Combined set for backward compat
    const all = new Set([...workoutMuscles, ...yogaMuscles, ...meditationMuscles]);

    return { workoutMuscles, yogaMuscles, meditationMuscles, all };
  }, [selectedWorkouts, selectedYoga, selectedMeditation]);

  const activeMuscles = muscleActivity.all;

  // Date strip: -30 to +7 days
  const weekStrip = useMemo(() => {
    // The 7 days (Sun–Sat) of the week containing selectedDate
    const d = new Date(selectedDate);
    const day = d.getDay(); // 0 = Sun
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(sunday);
      dd.setDate(sunday.getDate() + i);
      return dd;
    });
  }, [selectedDate]);

  const hasActivity = (date: Date) => workoutSessions.some((ws) => isSameDay2(ws.date, date)) || yogaSessions.some((ys) => isSameDay2(ys.date, date)) || meditationSessions.some((ms) => isSameDay2(ms.date, date) && ms.isCompleted);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <TabHeader accentColor={ACCENT} />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <View style={styles.inner}>

        {/* Weekly Volume Chart */}
        <Card>
          <Text style={styles.cardTitle}>Weekly Practice Volume</Text>
          <View style={styles.barSection}>
            <VolumeBar label="Strength" icon="🔱" minutes={weeklyStrengthMins} maxMinutes={180} color={AppTheme.workouts.accentColor} />
            <VolumeBar label="Yoga" icon="🪷" minutes={weeklyYogaMins} maxMinutes={120} color={AppTheme.yoga.accentColor} />
            <VolumeBar label="Meditation" icon="ॐ" minutes={weeklyMedMins} maxMinutes={90} color={AppTheme.meditation.accentColor} />
          </View>
        </Card>


        {/* Month header + calendar icon */}
        <View style={styles.monthBar}>
          <Text style={styles.monthLabel}>{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity onPress={() => { setCalMonth(selectedDate); setShowCalendar(true); }} style={styles.calIconBtn}>
            <Text style={styles.calIconOnly}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Fixed single-week strip (no horizontal scroll) */}
        <View style={styles.weekRow}>
          {weekStrip.map((date, idx) => {
            const isSelected = isSameDay2(date, selectedDate);
            const isToday = isSameDay2(date, new Date());
            const hasAct = hasActivity(date);
            return (
              <TouchableOpacity key={idx} style={[styles.weekCell, isSelected && { backgroundColor: ACCENT }, isToday && !isSelected && { borderColor: ACCENT, borderWidth: 1.5 }]} onPress={() => setSelectedDate(date)}>
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
        </View>

        {/* Week nav arrows */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 86400000))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.weekNavArrow}>‹ Prev week</Text>
          </TouchableOpacity>
          {!isSameDay2(selectedDate, new Date()) && (
            <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
              <Text style={[styles.weekNavToday, { color: ACCENT }]}>Today</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 86400000))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.weekNavArrow}>Next week ›</Text>
          </TouchableOpacity>
        </View>

        {/* Anatomy */}
        <Card>
          <Text style={styles.cardTitle}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <View style={styles.bodyMeditationRow}>
            <View style={styles.bodyCol}>
              <BodyGlow muscleActivity={muscleActivity} selectedMuscle={selectedMuscle} onTap={(m) => setSelectedMuscle(selectedMuscle === m ? null : m)} />
              <Text style={styles.figureLabel}>Body</Text>
            </View>
            <View style={styles.bodyCol}>
              <MeditationBuddha sessionsToday={selectedMeditation.length} />
              <Text style={styles.figureLabel}>Mind</Text>
            </View>
          </View>

          {/* Activity summary — clean icon chips, tap to expand */}
          {selectedWorkouts.length === 0 && selectedYoga.length === 0 && selectedMeditation.length === 0 ? (
            <Text style={styles.noActivity}>No activity logged on this day</Text>
          ) : (
            <ActivitySummary
              workouts={selectedWorkouts}
              yoga={selectedYoga}
              meditation={selectedMeditation}
            />
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
      </View>
    </ScrollView>

    {/* Jump-to-date calendar modal */}
    <Modal visible={showCalendar} animationType="fade" transparent onRequestClose={() => setShowCalendar(false)}>
      <TouchableOpacity activeOpacity={1} onPress={() => setShowCalendar(false)} style={styles.calOverlay}>
        <TouchableOpacity activeOpacity={1} style={styles.calSheet}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>
              <Text style={styles.calNav}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calTitle}>{calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>
              <Text style={styles.calNav}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calWeekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.calWeekday}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {(() => {
              const year = calMonth.getFullYear();
              const month = calMonth.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells: (Date | null)[] = [];
              for (let i = 0; i < firstDay; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
              return cells.map((date, i) => {
                if (!date) return <View key={i} style={styles.calCell} />;
                const isSel = isSameDay2(date, selectedDate);
                const isToday = isSameDay2(date, new Date());
                const act = hasActivity(date);
                return (
                  <TouchableOpacity key={i} style={[styles.calCell, isSel && { backgroundColor: ACCENT, borderRadius: 10 }]}
                    onPress={() => { setSelectedDate(date); setShowCalendar(false); }}>
                    <Text style={[styles.calDay, isSel && { color: '#fff', fontWeight: '800' }, isToday && !isSel && { color: ACCENT, fontWeight: '800' }]}>{date.getDate()}</Text>
                    {act && <View style={[styles.calActDot, { backgroundColor: isSel ? '#fff' : ACCENT }]} />}
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
          <TouchableOpacity style={[styles.calToday, { borderColor: ACCENT }]} onPress={() => { const t = new Date(); setSelectedDate(t); setCalMonth(t); setShowCalendar(false); }}>
            <Text style={[styles.calTodayLabel, { color: ACCENT }]}>Jump to Today</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    </View>
  );
}

// ─── Volume Bar ───────────────────────────────────────────────────
function VolumeBar({ label, icon, minutes, maxMinutes, color }: { label: string; icon: string; minutes: number; maxMinutes: number; color: string }) {
  const fraction = Math.min(minutes / maxMinutes, 1);
  const barW = (SCREEN_W - AppLayout.screenMargin * 2 - AppLayout.cardPadding * 2 - 80) * fraction;

  return (
    <View style={styles.barRow}>
      {icon === '🔱' ? <Image source={require('../../../assets/gada_silver.png')} style={{ width: 18, height: 18 }} resizeMode="contain" /> : <Text style={styles.barIcon}>{icon}</Text>}
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

const BODY_W = 120;
const BODY_H = 250;

// Front-view muscle regions (proportional to image)
const MUSCLE_POS_FRONT: Record<string, { top: number; left: number; w: number; h: number }> = {
  Shoulders:  { top: 0.20, left: 0.18, w: 0.64, h: 0.07 },
  Chest:      { top: 0.26, left: 0.28, w: 0.44, h: 0.08 },
  Biceps:     { top: 0.30, left: 0.11, w: 0.15, h: 0.11 },
  Triceps:    { top: 0.30, left: 0.74, w: 0.15, h: 0.11 },
  Abs:        { top: 0.36, left: 0.37, w: 0.26, h: 0.12 },
  Quads:      { top: 0.55, left: 0.29, w: 0.42, h: 0.15 },
  Calves:     { top: 0.78, left: 0.31, w: 0.38, h: 0.11 },
};

// Back-view muscle regions
const MUSCLE_POS_BACK: Record<string, { top: number; left: number; w: number; h: number }> = {
  Shoulders:  { top: 0.20, left: 0.18, w: 0.64, h: 0.07 },
  Back:       { top: 0.27, left: 0.28, w: 0.44, h: 0.16 },
  Triceps:    { top: 0.30, left: 0.11, w: 0.15, h: 0.11 },
  Biceps:     { top: 0.30, left: 0.74, w: 0.15, h: 0.11 },
  Glutes:     { top: 0.50, left: 0.30, w: 0.40, h: 0.08 },
  Hamstrings: { top: 0.58, left: 0.29, w: 0.42, h: 0.15 },
  Calves:     { top: 0.78, left: 0.31, w: 0.38, h: 0.11 },
};

const ACTIVITY_GLOW: Record<string, string> = {
  workout: '#FF5500',
  yoga: '#DA70D6',
  meditation: '#D4A843',
};

// Clean collapsible activity summary — icon chips that drill into detail
function ActivitySummary({ workouts, yoga, meditation }: {
  workouts: WorkoutSession[]; yoga: YogaSession[]; meditation: MeditationSession[];
}) {
  const [open, setOpen] = useState<'workout' | 'yoga' | 'meditation' | null>(null);
  const [openMuscle, setOpenMuscle] = useState<string | null>(null);

  const chips: { key: 'workout' | 'yoga' | 'meditation'; icon: string; label: string; count: number; color: string }[] = [
    { key: 'workout', icon: '🔱', label: 'Workouts', count: workouts.length, color: '#FF5500' },
    { key: 'yoga', icon: '🪷', label: 'Yoga', count: yoga.length, color: '#DA70D6' },
    { key: 'meditation', icon: 'ॐ', label: 'Dhyana', count: meditation.length, color: '#D4A843' },
  ].filter(c => c.count > 0);

  // All completed sets across the day's workouts, grouped by muscle
  const setsByMuscle: Record<string, { name: string; weight: number; reps: number }[]> = {};
  workouts.forEach(ws => (ws.sets ?? []).filter(s => s.isCompleted).forEach(s => {
    const cat = s.exercise?.category ?? 'Other';
    (setsByMuscle[cat] ||= []).push({ name: s.exercise?.name ?? 'Exercise', weight: s.weight, reps: s.reps });
  }));
  const workedMuscles = Object.keys(setsByMuscle);

  // Yoga categories worked across the day
  const yogaCats = Array.from(new Set(yoga.flatMap(y => y.categories ?? [])));

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        {chips.map(c => {
          const active = open === c.key;
          return (
            <TouchableOpacity key={c.key}
              onPress={() => { setOpen(active ? null : c.key); setOpenMuscle(null); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 7,
                backgroundColor: active ? c.color : c.color + '12',
                borderColor: c.color + (active ? 'FF' : '40'), borderWidth: 1,
                paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14,
              }}>
              {c.icon === '🔱' ? <Image source={require('../../../assets/gada_silver.png')} style={{ width: 17, height: 17 }} resizeMode="contain" /> : <Text style={{ fontSize: 17 }}>{c.icon}</Text>}
              <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : c.color }}>{c.count}</Text>
              <Text style={{ fontSize: 12, color: active ? '#fff' : c.color, opacity: 0.85 }}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* WORKOUT → muscle group chips → exercises */}
      {open === 'workout' && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7 }}>
            {workedMuscles.map(m => {
              const c = MUSCLE_COLORS[m] ?? '#FF5500';
              const sel = openMuscle === m;
              return (
                <TouchableOpacity key={m} onPress={() => setOpenMuscle(sel ? null : m)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: sel ? c : c + '16', borderColor: c + (sel ? 'FF' : '50'), borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 13 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sel ? '#fff' : c }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: sel ? '#fff' : c }}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {openMuscle && (
            <View style={{ backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, gap: 5 }}>
              {setsByMuscle[openMuscle].map((e, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12.5, color: '#444' }}>{e.name}</Text>
                  <Text style={{ fontSize: 12.5, color: '#999', fontWeight: '600' }}>{e.weight} lbs × {e.reps}</Text>
                </View>
              ))}
            </View>
          )}
          {!openMuscle && <Text style={{ fontSize: 10.5, color: '#BBB', textAlign: 'center' }}>tap a muscle to see exercises</Text>}
        </View>
      )}

      {/* YOGA → categories */}
      {open === 'yoga' && (
        <View style={{ gap: 8 }}>
          {yoga.map(ys => (
            <View key={ys.id} style={{ backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#333', fontWeight: '600' }}>{ys.name}</Text>
                <Text style={{ fontSize: 12, color: '#999' }}>{formatTime(ys.duration)}</Text>
              </View>
              {ys.categories?.length > 0 && (
                <Text style={{ fontSize: 11, color: '#A878A0', marginTop: 3 }}>{ys.categories.join(' · ')}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* DHYANA → individual meditation icons (per practice) → detail */}
      {open === 'meditation' && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {meditation.map((ms) => {
              const sel = openMuscle === ms.id;
              const emoji = ms.practiceId ? (MED_EMOJI[ms.practiceId] ?? 'ॐ') : 'ॐ';
              return (
                <TouchableOpacity key={ms.id} onPress={() => setOpenMuscle(sel ? null : ms.id)}
                  style={{ alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 24, backgroundColor: sel ? '#D4A843' : '#D4A84314', borderColor: '#D4A843' + (sel ? 'FF' : '40'), borderWidth: 1 }}>
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {openMuscle && (() => {
            const ms = meditation.find(m => m.id === openMuscle);
            if (!ms) return null;
            const name = ms.practiceId ? (MED_NAME[ms.practiceId] ?? 'Meditation') : 'Meditation';
            const emoji = ms.practiceId ? (MED_EMOJI[ms.practiceId] ?? 'ॐ') : 'ॐ';
            return (
              <View style={{ backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#444', fontWeight: '600' }}>{emoji} {name}</Text>
                <Text style={{ fontSize: 12.5, color: '#999' }}>{formatTime(ms.duration)}</Text>
              </View>
            );
          })()}
          {!openMuscle && <Text style={{ fontSize: 10.5, color: '#BBB', textAlign: 'center' }}>tap a practice to see details</Text>}
        </View>
      )}
    </View>
  );
}

function BodyGlow({ muscleActivity, selectedMuscle, onTap }: {
  muscleActivity: MuscleActivityData; selectedMuscle: string | null; onTap: (m: string) => void;
}) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const flip = useRef(new Animated.Value(0)).current;
  const positions = view === 'front' ? MUSCLE_POS_FRONT : MUSCLE_POS_BACK;
  const bodyImg = view === 'front'
    ? require('../../../assets/figures/body_front.png')
    : require('../../../assets/figures/body_back.png');

  const rotate = (target: 'front' | 'back') => {
    if (target === view) return;
    Animated.timing(flip, { toValue: 0.5, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setView(target);
      flip.setValue(0.5);
      Animated.timing(flip, { toValue: target === 'back' ? 1 : 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  };
  const scaleX = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.05, 1] });

  function muscleColor(muscle: string): string | null {
    // Workout muscles use their exercise-library color; yoga uses its activity color.
    // Meditation is represented on the Buddha (rings), not the body.
    if (muscleActivity.workoutMuscles.has(muscle)) return MUSCLE_COLORS[muscle] ?? ACTIVITY_GLOW.workout;
    if (muscleActivity.yogaMuscles.has(muscle)) return ACTIVITY_GLOW.yoga;
    return null;
  }

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: BODY_W + 56, height: BODY_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => rotate('front')} hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }} style={{ width: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, color: view === 'back' ? '#999' : '#DDD' }}>‹</Text>
        </TouchableOpacity>

        <Animated.View style={{ width: BODY_W, height: BODY_H, transform: [{ scaleX }] }}>
          {/* Base silhouette — natural black */}
          <Image source={bodyImg} style={{ width: BODY_W, height: BODY_H, resizeMode: 'contain' }} />
          {/* Marker dots on each worked muscle */}
          {Object.entries(positions).map(([muscle, pos]) => {
            const c = muscleColor(muscle);
            if (!c) return null;
            const cx = (pos.left + pos.w / 2) * BODY_W;
            const cy = (pos.top + pos.h / 2) * BODY_H;
            const isSel = selectedMuscle === muscle;
            return (
              <View key={muscle} style={{
                position: 'absolute', top: cy - 6, left: cx - 6,
                width: 12, height: 12, borderRadius: 6,
                backgroundColor: c, borderWidth: 2, borderColor: '#fff',
                transform: isSel ? [{ scale: 1.4 }] : [],
                shadowColor: c, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
              }} />
            );
          })}
          {Object.entries(positions).map(([muscle, pos]) => (
            <TouchableOpacity key={'tap-' + muscle} onPress={() => onTap(muscle)}
              style={{ position: 'absolute', top: pos.top * BODY_H, left: pos.left * BODY_W, width: pos.w * BODY_W, height: pos.h * BODY_H }} />
          ))}
        </Animated.View>

        <TouchableOpacity onPress={() => rotate('back')} hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }} style={{ width: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, color: view === 'front' ? '#999' : '#DDD' }}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 10, color: '#BBB' }}>{view === 'front' ? 'Front' : 'Back'} · tap ‹ › to rotate</Text>
    </View>
  );
}

// Buddha on Summary — rings accumulate behind the head per meditation today
// Ring colors radiating outward — matches the chakra-halo reference
const RING_COLORS = ['#FFC21E', '#FF6A2C', '#E84FD8', '#7B6BFF', '#22B5F0', '#34D266'];

function MeditationBuddha({ sessionsToday }: { sessionsToday: number }) {
  const glow = useRef(new Animated.Value(0.5)).current;
  // One breathing driver per possible ring (max 6), each staggered
  const ringAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    // staggered breathing ripple — each ring pulses slightly after the previous
    ringAnims.forEach((a, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 350),
          Animated.timing(a, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const BUD_W = 120;
  const BUD_H = 250;
  const headCx = BUD_W / 2;
  const headCy = BUD_H * 0.235;
  const count = Math.min(sessionsToday, 6);

  return (
    <View style={{ width: BUD_W, height: BUD_H, alignSelf: 'center' }}>
      {/* Radiant golden halo behind head */}
      {count > 0 && (
        <>
          <Animated.View style={{
            position: 'absolute', top: headCy - 44, left: headCx - 44,
            width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFE08A',
            opacity: glow.interpolate({ inputRange: [0.5, 1], outputRange: [0.1, 0.2] }),
          }} />
          <Animated.View style={{
            position: 'absolute', top: headCy - 32, left: headCx - 32,
            width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFD158',
            opacity: glow.interpolate({ inputRange: [0.5, 1], outputRange: [0.22, 0.4] }),
          }} />
        </>
      )}

      {/* Concentric rings — each breathes (scale + opacity), staggered outward */}
      {Array.from({ length: count }).map((_, i) => {
        const baseSize = 44 + i * 11;
        const color = RING_COLORS[i % RING_COLORS.length];
        const a = ringAnims[i];
        const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] });
        const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: headCy - baseSize / 2,
              left: headCx - baseSize / 2,
              width: baseSize,
              height: baseSize,
              borderRadius: baseSize / 2,
              borderWidth: 1.5,
              borderColor: color,
              opacity,
              transform: [{ scale }],
              shadowColor: color, shadowOpacity: 1, shadowRadius: 7, shadowOffset: { width: 0, height: 0 },
            }}
          />
        );
      })}

      <Image
        source={require('../../../assets/figures/buddha.png')}
        style={{ width: BUD_W, height: BUD_H, resizeMode: 'contain' }}
      />
    </View>
  );
}




interface MuscleActivityData {
  workoutMuscles: Set<string>;
  yogaMuscles: Set<string>;
  meditationMuscles: Set<string>;
  all: Set<string>;
}

function muscleFill(muscle: string, data: MuscleActivityData): string {
  const w = data.workoutMuscles.has(muscle);
  const y = data.yogaMuscles.has(muscle);
  const m = data.meditationMuscles.has(muscle);
  if (!w && !y && !m) return '#E8E8E8';
  if (w) return '#FF5500'; // workout wins — solid amber
  if (y) return '#DA70D6'; // yoga — orchid
  return '#D4A843'; // meditation — gold
}

function MuscleShape({ d, cx, cy, rx, ry, muscle, data, onTap, isEllipse = false }: {
  d?: string; cx?: number; cy?: number; rx?: number; ry?: number;
  muscle: string; data: MuscleActivityData; onTap: (m: string) => void; isEllipse?: boolean;
}) {
  const w = data.workoutMuscles.has(muscle);
  const y = data.yogaMuscles.has(muscle);
  const m = data.meditationMuscles.has(muscle);
  const fill = muscleFill(muscle, data);
  const active = w || y || m;

  return (
    <>
      {/* Base muscle shape */}
      {isEllipse ? (
        <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={active ? 0.9 : 0.8} onPress={() => onTap(muscle)} />
      ) : (
        <Path d={d} fill={fill} opacity={active ? 0.9 : 0.8} onPress={() => onTap(muscle)} />
      )}

      {/* YOGA ring — orchid, close ring */}
      {y && isEllipse && (
        <>
          <Ellipse cx={cx} cy={cy} rx={(rx ?? 0) + 2.5} ry={(ry ?? 0) + 2.5}
            fill="none" stroke="#DA70D6" strokeWidth={2.5} opacity={0.8}
            strokeDasharray="4 2" />
        </>
      )}

      {/* MEDITATION ring — gold, wider ring */}
      {m && isEllipse && (
        <>
          <Ellipse cx={cx} cy={cy} rx={(rx ?? 0) + (y ? 6 : 2.5)} ry={(ry ?? 0) + (y ? 6 : 2.5)}
            fill="none" stroke="#D4A843" strokeWidth={2} opacity={0.75}
            strokeDasharray="6 3" />
        </>
      )}

      {/* WORKOUT ring — amber solid outer glow if also yoga/meditation */}
      {w && (y || m) && isEllipse && (
        <Ellipse cx={cx} cy={cy} rx={(rx ?? 0) + (y && m ? 9 : 6)} ry={(ry ?? 0) + (y && m ? 9 : 6)}
          fill="none" stroke="#FF5500" strokeWidth={1.5} opacity={0.5} />
      )}
    </>
  );
}

function AnatomyFigureFront({ muscleActivity, selectedMuscle, onTap }: { muscleActivity: MuscleActivityData; selectedMuscle: string | null; onTap: (m: string) => void }) {
  return (
    <Svg width={FIGURE_W} height={FIGURE_H} viewBox="0 0 90 200">
      <Ellipse cx="45" cy="14" rx="13" ry="14" fill="#D4A574" />
      <Rect x="39" y="26" width="12" height="10" fill="#D4A574" />
      <Path d="M25,36 Q45,32 65,36 L68,72 Q45,76 22,72 Z" fill={muscleFill('Chest', muscleActivity)} opacity={0.9} onPress={() => onTap('Chest')} />
      {muscleActivity.yogaMuscles.has('Chest') && <Ellipse cx={45} cy={54} rx={22} ry={18} fill="none" stroke="#DA70D6" strokeWidth={2.5} opacity={0.7} strokeDasharray="4 2" />}
      {muscleActivity.meditationMuscles.has('Chest') && <Ellipse cx={45} cy={54} rx={muscleActivity.yogaMuscles.has('Chest') ? 27 : 22} ry={muscleActivity.yogaMuscles.has('Chest') ? 23 : 18} fill="none" stroke="#D4A843" strokeWidth={2} opacity={0.65} strokeDasharray="6 3" />}
      <Path d="M29,72 Q45,76 61,72 L58,105 Q45,108 32,105 Z" fill={muscleFill('Abs', muscleActivity)} opacity={0.9} onPress={() => onTap('Abs')} />
      {muscleActivity.yogaMuscles.has('Abs') && <Ellipse cx={45} cy={88} rx={18} ry={17} fill="none" stroke="#DA70D6" strokeWidth={2.5} opacity={0.7} strokeDasharray="4 2" />}
      {muscleActivity.meditationMuscles.has('Abs') && <Ellipse cx={45} cy={88} rx={muscleActivity.yogaMuscles.has('Abs') ? 23 : 18} ry={muscleActivity.yogaMuscles.has('Abs') ? 22 : 17} fill="none" stroke="#D4A843" strokeWidth={2} opacity={0.65} strokeDasharray="6 3" />}
      <MuscleShape isEllipse cx={18} cy={42} rx={10} ry={12} muscle="Shoulders" data={muscleActivity} onTap={onTap} />
      <MuscleShape isEllipse cx={72} cy={42} rx={10} ry={12} muscle="Shoulders" data={muscleActivity} onTap={onTap} />
      <Path d="M8,54 Q14,52 18,54 L19,80 Q13,82 8,80 Z" fill={muscleFill('Biceps', muscleActivity)} opacity={0.85} onPress={() => onTap('Biceps')} />
      <Path d="M72,54 Q76,52 82,54 L82,80 Q76,82 71,80 Z" fill={muscleFill('Biceps', muscleActivity)} opacity={0.85} onPress={() => onTap('Biceps')} />
      <Path d="M5,80 Q10,78 15,80 L14,105 Q8,107 5,105 Z" fill={muscleFill('Triceps', muscleActivity)} opacity={0.85} onPress={() => onTap('Triceps')} />
      <Path d="M75,80 Q80,78 85,80 L85,105 Q80,107 76,105 Z" fill={muscleFill('Triceps', muscleActivity)} opacity={0.85} onPress={() => onTap('Triceps')} />
      <Path d="M30,108 Q44,110 45,110 L44,155 Q36,157 28,155 Z" fill={muscleFill('Quads', muscleActivity)} opacity={0.85} onPress={() => onTap('Quads')} />
      <Path d="M46,110 Q58,110 60,108 L62,155 Q54,157 46,155 Z" fill={muscleFill('Quads', muscleActivity)} opacity={0.85} onPress={() => onTap('Quads')} />
      <Path d="M30,157 Q36,155 41,157 L40,188 Q35,190 30,188 Z" fill={muscleFill('Calves', muscleActivity)} opacity={0.85} onPress={() => onTap('Calves')} />
      <Path d="M49,157 Q54,155 60,157 L60,188 Q55,190 50,188 Z" fill={muscleFill('Calves', muscleActivity)} opacity={0.85} onPress={() => onTap('Calves')} />
    </Svg>
  );
}

function AnatomyFigureBack({ muscleActivity, selectedMuscle, onTap }: { muscleActivity: MuscleActivityData; selectedMuscle: string | null; onTap: (m: string) => void }) {
  return (
    <Svg width={FIGURE_W} height={FIGURE_H} viewBox="0 0 90 200">
      <Ellipse cx="45" cy="14" rx="13" ry="14" fill="#D4A574" />
      <Rect x="39" y="26" width="12" height="10" fill="#D4A574" />
      <Path d="M25,36 Q45,32 65,36 L68,72 Q45,76 22,72 Z" fill={muscleFill('Back', muscleActivity)} opacity={0.9} onPress={() => onTap('Back')} />
      <Path d="M29,72 Q45,76 61,72 L58,100 Q45,103 32,100 Z" fill={muscleFill('Back', muscleActivity)} opacity={0.9} onPress={() => onTap('Back')} />
      {muscleActivity.yogaMuscles.has('Back') && <Ellipse cx={45} cy={67} rx={24} ry={34} fill="none" stroke="#DA70D6" strokeWidth={2.5} opacity={0.65} strokeDasharray="4 2" />}
      {muscleActivity.meditationMuscles.has('Back') && <Ellipse cx={45} cy={67} rx={muscleActivity.yogaMuscles.has('Back') ? 29 : 24} ry={muscleActivity.yogaMuscles.has('Back') ? 39 : 34} fill="none" stroke="#D4A843" strokeWidth={2} opacity={0.6} strokeDasharray="6 3" />}
      <MuscleShape isEllipse cx={18} cy={42} rx={10} ry={12} muscle="Shoulders" data={muscleActivity} onTap={onTap} />
      <MuscleShape isEllipse cx={72} cy={42} rx={10} ry={12} muscle="Shoulders" data={muscleActivity} onTap={onTap} />
      <Path d="M8,54 Q14,52 19,54 L19,85 Q13,87 8,85 Z" fill={muscleFill('Triceps', muscleActivity)} opacity={0.85} onPress={() => onTap('Triceps')} />
      <Path d="M71,54 Q76,52 82,54 L82,85 Q76,87 71,85 Z" fill={muscleFill('Triceps', muscleActivity)} opacity={0.85} onPress={() => onTap('Triceps')} />
      <Path d="M28,100 Q45,104 62,100 L62,120 Q45,124 28,120 Z" fill={muscleFill('Glutes', muscleActivity)} opacity={0.85} onPress={() => onTap('Glutes')} />
      <MuscleShape isEllipse cx={36} cy={137} rx={8} ry={17} muscle="Hamstrings" data={muscleActivity} onTap={onTap} />
      <MuscleShape isEllipse cx={54} cy={137} rx={8} ry={17} muscle="Hamstrings" data={muscleActivity} onTap={onTap} />
      <Path d="M30,157 Q36,155 41,157 L40,188 Q35,190 30,188 Z" fill={muscleFill('Calves', muscleActivity)} opacity={0.85} onPress={() => onTap('Calves')} />
      <Path d="M49,157 Q54,155 60,157 L60,188 Q55,190 50,188 Z" fill={muscleFill('Calves', muscleActivity)} opacity={0.85} onPress={() => onTap('Calves')} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#FAFAFA' },
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
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: AppLayout.screenMargin, gap: 5 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 14, gap: 3, borderWidth: 1.5, borderColor: 'transparent' },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: AppLayout.screenMargin + 4, paddingTop: 8 },
  weekNavArrow: { fontSize: 12.5, color: '#AAA', fontWeight: '600' },
  weekNavToday: { fontSize: 12.5, fontWeight: '800' },
  calIconBtn: { padding: 4 },
  calIconOnly: { fontSize: 20 },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: AppLayout.screenMargin, marginTop: 4, marginBottom: 8 },
  monthLabel: { fontSize: 17, fontWeight: '800', color: Colors.label },
  calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', paddingHorizontal: 24 },
  calSheet: { backgroundColor: '#fff', borderRadius: 20, padding: 18 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calTitle: { fontSize: 17, fontWeight: '800', color: Colors.label },
  calNav: { fontSize: 26, color: '#999', paddingHorizontal: 12 },
  calWeekRow: { flexDirection: 'row', marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#BBB' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  calDay: { fontSize: 14, color: Colors.label },
  calActDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  calToday: { marginTop: 14, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  calTodayLabel: { fontSize: 14, fontWeight: '800' },
  dateCell: { width: 44, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.cardBackground, gap: 2 },
  dateDayLabel: { fontSize: 9, fontWeight: '800' },
  dateDayNum: { fontSize: 16, fontWeight: '700' },
  dateDot: { width: 5, height: 5, borderRadius: 3 },
  anatomyRow: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  bodyMeditationRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start', marginVertical: 12 },
  bodyCol: { alignItems: 'center', gap: 6 },
  figureLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1 },
  activityLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#888', fontWeight: '500' },
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
