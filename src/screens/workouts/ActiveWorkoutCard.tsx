import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
  ScrollView, Alert, Modal, Animated, Easing, AppState,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppStore } from '../../store/AppStore';
import { WorkoutSet, Exercise } from '../../db/database';
import { Colors } from '../../theme';
import { formatTime, formatMinSec } from '../../utils';
import {
  getLastSessionSets, checkForPR, getSuggestion, LastSessionSet,
} from '../../db/workoutAnalytics';
import { getFavouriteIds } from '../../db/stepTracker';

interface Props {
  session: any;
  exercises: Exercise[];
  accentColor: string;
  onComplete: () => void;
  onDelete: () => void;
}

// ─── Rest Timer Component ─────────────────────────────────────────
function RestTimer({ duration, onDone, accentColor }: { duration: number; onDone: () => void; accentColor: string }) {
  const [remaining, setRemaining] = useState(duration);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(t); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const progress = remaining / duration;
  const size = 56;
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - progress);

  return (
    <View style={rt.wrap}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke="#EEE" strokeWidth={strokeWidth} fill="none"/>
        <Circle cx={size/2} cy={size/2} r={r} stroke={accentColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={dashOffset}
          strokeLinecap="round" rotation="-90" origin={`${size/2},${size/2}`}/>
      </Svg>
      <View style={rt.center}>
        <Text style={[rt.time, { color: accentColor }]}>{remaining}</Text>
      </View>
      <TouchableOpacity style={[rt.skipBtn, { borderColor: accentColor }]} onPress={onDone}>
        <Text style={[rt.skipLabel, { color: accentColor }]}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const rt = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', width: 56, height: 56 },
  time: { fontSize: 14, fontWeight: '900' },
  skipBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  skipLabel: { fontSize: 9, fontWeight: '700' },
});

// ─── PR Celebration Overlay ───────────────────────────────────────
function PRCelebration({ type, onDone }: { type: string; onDone: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[pr.overlay, { opacity }]}>
      <Animated.View style={[pr.card, { transform: [{ scale }] }]}>
        <Text style={pr.trophy}>🏆</Text>
        <Text style={pr.title}>NEW PR!</Text>
        <Text style={pr.sub}>{type}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const pr = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 100, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, shadowColor: '#FFD700', shadowOpacity: 0.6, shadowRadius: 20, elevation: 10, borderWidth: 2, borderColor: '#FFD700' },
  trophy: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '900', color: '#111' },
  sub: { fontSize: 14, color: '#888', fontWeight: '600' },
});

// ─── Main ActiveWorkoutCard ───────────────────────────────────────
const PICKER_CATS = [
  { key: '⭐', label: '⭐ Saved', color: '#FFD700' },
  { key: 'Chest', label: 'Chest', color: '#FF5500' },
  { key: 'Back', label: 'Back', color: '#007AFF' },
  { key: 'Shoulders', label: 'Delts', color: '#DA70D6' },
  { key: 'Biceps', label: 'Biceps', color: '#34C759' },
  { key: 'Triceps', label: 'Triceps', color: '#00C7BE' },
  { key: 'Abs', label: 'Abs', color: '#FF9500' },
  { key: 'Quads', label: 'Quads', color: '#FF2D55' },
  { key: 'Hamstrings', label: 'Hams', color: '#AF52DE' },
  { key: 'Glutes', label: 'Glutes', color: '#5856D6' },
  { key: 'Calves', label: 'Calves', color: '#FF6B6B' },
  { key: 'Cardio', label: 'Cardio', color: '#FF3B30' },
];

export function ActiveWorkoutCard({ session, exercises, accentColor, onComplete, onDelete }: Props) {
  const { addWorkoutSet, saveWorkoutSet, removeWorkoutSet, workoutSessions } = useAppStore();
  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [pickerCat, setPickerCat] = useState('⭐');
  const [search, setSearch] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null);
  const [restTimer, setRestTimer] = useState<{ exerciseName: string; duration: number } | null>(null);
  const [prCelebration, setPrCelebration] = useState<string | null>(null);
  const [restDuration, setRestDuration] = useState(90); // seconds, customizable
  const [userPickedExId, setUserPickedExId] = useState<string | null>(null); // exercise user explicitly chose to do next
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const liveSession = workoutSessions.find((s) => s.id === session.id) ?? session;
  const sets = liveSession.sets ?? [];
  const completedSets = sets.filter((s: WorkoutSet) => s.isCompleted).length;
  const hasIncompleteSets = sets.some((s: WorkoutSet) => !s.isCompleted);

  useEffect(() => {
    const start = new Date(session.date).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const tick = setInterval(update, 1000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') update(); });
    return () => { clearInterval(tick); sub.remove(); };
  }, [session.date]);

  // Group sets by exercise
  const grouped: { exercise: Exercise | null; sets: WorkoutSet[]; lastSets: LastSessionSet[]; suggestion: any }[] = [];
  const seen = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    const key = s.exerciseId ?? '__none__';
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(s);
  }
  seen.forEach((setSList, key) => {
    const ex = exercises.find((e) => e.id === key) ?? null;
    const lastSets = ex ? getLastSessionSets(ex.id, session.id) : [];
    const suggestion = getSuggestion(lastSets);
    grouped.push({ exercise: ex, sets: setSList, lastSets, suggestion });
  });

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function skipExercise(exercise: Exercise | null, exSets: WorkoutSet[]) {
    if (!exercise) return;
    Alert.alert(
      `Skip ${exercise.name}?`,
      'This removes it from today\'s workout. Your routine keeps it for next time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: () => {
          // Remove only the incomplete sets of this exercise
          exSets.filter((s) => !s.isCompleted).forEach((s) => removeWorkoutSet(s.id));
          if (userPickedExId === exercise.id) setUserPickedExId(null);
        }},
      ]
    );
  }

  function tryAddSet(exercise: Exercise, currentGroupSets: WorkoutSet[]) {
    const hasIncomplete = currentGroupSets.some((s) => !s.isCompleted);
    if (hasIncomplete) {
      shake();
      Alert.alert('Complete Current Set First', 'Mark all sets as done ✓ before adding another.', [{ text: 'Got it' }]);
      return;
    }
    startCountdown(exercise);
  }

  function tryAddExercise() {
    if (hasIncompleteSets) {
      shake();
      Alert.alert('Finish Your Sets First', 'Complete all current sets ✓ before adding a new exercise.', [{ text: 'Got it' }]);
      return;
    }
    setShowAddExercise(true);
  }

  function handleSetCompleted(set: WorkoutSet, exercise: Exercise | null, weight: number, reps: number) {
    saveWorkoutSet({ id: set.id, isCompleted: true, weight, reps });
    // Check for PR
    if (exercise && !exercise.isCardio && weight > 0 && reps > 0) {
      const pr = checkForPR(exercise.id, weight, reps, session.id);
      if (pr.isWeightPR) setPrCelebration('New Weight Record! 🔥');
      else if (pr.isVolumePR) setPrCelebration('New Volume Record! 💪');
      else if (pr.isRepsPR) setPrCelebration('New Reps Record! ⚡');
    }
    // Start rest timer
    if (exercise) {
      setRestTimer({ exerciseName: exercise.name, duration: restDuration });
    }
  }

  function startCountdown(exercise: Exercise) {
    setPendingExercise(exercise);
    setCountdown(5);
    setShowAddExercise(false);
    setSearch('');
  }

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (pendingExercise) {
        addWorkoutSet({
          exerciseId: pendingExercise.id,
          sessionId: session.id,
          weight: (pendingExercise.isCardio || pendingExercise.isTimed) ? 0 : 45,
          reps: (pendingExercise.isCardio || pendingExercise.isTimed) ? 0 : 10,
          isCompleted: false,
          duration: pendingExercise.isTimed ? 30 : pendingExercise.isCardio ? 600 : null,
          distance: pendingExercise.isCardio ? 1.0 : null,
          overriddenNotes: null,
        });
      }
      setCountdown(null);
      setPendingExercise(null);
      return;
    }
    Animated.sequence([
      Animated.timing(countdownAnim, { toValue: 1.4, duration: 200, useNativeDriver: true }),
      Animated.timing(countdownAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setCountdown((c) => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const favIds = getFavouriteIds();
  const pickerExercises = useMemo(() => {
    let list = exercises;
    if (search) {
      // Search is generic — searches ALL exercises regardless of category
      list = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    } else if (pickerCat === '⭐') {
      list = exercises.filter(e => favIds.includes(e.id));
    } else {
      list = exercises.filter(e => e.category === pickerCat);
    }
    // Favourites first
    return [...list].sort((a, b) => {
      const aF = favIds.includes(a.id) ? 0 : 1;
      const bF = favIds.includes(b.id) ? 0 : 1;
      return aF - bF;
    });
  }, [exercises, pickerCat, search, favIds]);

  const filteredExercises = pickerExercises;

  // Breathing countdown
  if (countdown !== null && pendingExercise) {
    return (
      <View style={[styles.card, styles.countdownCard]}>
        <Text style={styles.countdownExName}>{pendingExercise.name}</Text>
        <Text style={styles.countdownLabel}>GET READY</Text>
        <Animated.Text style={[styles.countdownNum, { transform: [{ scale: countdownAnim }], color: accentColor }]}>
          {countdown === 0 ? 'GO!' : countdown}
        </Animated.Text>
        <Text style={styles.countdownSub}>Breathe in · Breathe out · Focus</Text>
        <TouchableOpacity
          onPress={() => {
            // Skip only skips the timer — exercise is still added
            if (pendingExercise) {
              addWorkoutSet({
                exerciseId: pendingExercise.id,
                sessionId: session.id,
                weight: (pendingExercise.isCardio || pendingExercise.isTimed) ? 0 : 45,
                reps: (pendingExercise.isCardio || pendingExercise.isTimed) ? 0 : 10,
                isCompleted: false,
                duration: pendingExercise.isTimed ? 30 : pendingExercise.isCardio ? 600 : null,
                distance: pendingExercise.isCardio ? 1.0 : null,
                overriddenNotes: null,
              });
            }
            setCountdown(null);
            setPendingExercise(null);
          }}
          style={styles.skipBtn}
        >
          <Text style={styles.skipBtnLabel}>Skip timer only →</Text>
          <Text style={styles.skipBtnSub}>exercise still added</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View style={styles.card}>
        {/* PR Celebration overlay */}
        {prCelebration && <PRCelebration type={prCelebration} onDone={() => setPrCelebration(null)} />}

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionName}>{liveSession.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.timer, { color: accentColor }]}>⏱ {formatTime(elapsed)}</Text>
              {/* Rest timer inline */}
              {restTimer && (
                <View style={styles.restInline}>
                  <Text style={styles.restLabel}>REST</Text>
                  <RestTimer
                    duration={restTimer.duration}
                    accentColor={accentColor}
                    onDone={() => setRestTimer(null)}
                  />
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: accentColor }]}
            onPress={() => Alert.alert('Complete Workout?', `${completedSets} sets done · ${formatTime(elapsed)}`, [
              { text: 'Keep Going', style: 'cancel' },
              { text: 'Finish 💪', onPress: onComplete },
            ])}
          >
            <Text style={styles.completeBtnLabel}>Finish</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Discard Workout?', 'All sets will be deleted.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: onDelete },
          ])}>
            <Text style={styles.discardBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{completedSets}/{sets.length} sets completed</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: sets.length > 0 ? `${(completedSets / sets.length) * 100}%` : '0%', backgroundColor: accentColor }]} />
          </View>
        </View>

        {/* Rest duration selector */}
        <View style={styles.restDurationRow}>
          <Text style={styles.restDurationLabel}>REST TIMER</Text>
          {[60, 90, 120, 180].map((d) => (
            <TouchableOpacity key={d} style={[styles.restDurationChip, restDuration === d && { backgroundColor: accentColor }]} onPress={() => setRestDuration(d)}>
              <Text style={[styles.restDurationChipLabel, restDuration === d && { color: '#fff' }]}>{d}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty state — fresh workout, no exercises yet */}
        {grouped.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 28, gap: 6 }}>
            <Image source={require('../../../assets/gada_silver.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#333' }}>Ready when you are</Text>
            <Text style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>Timer's running. Add your first exercise to begin.</Text>
          </View>
        )}

        {/* Exercises */}
        {/* Determine which exercise is currently active (one-at-a-time).
            Active = user's explicit pick if it still has incomplete sets,
            otherwise the FIRST group with incomplete sets. */}
        {(() => { return null; })()}
        {grouped.map(({ exercise, sets: exSets, lastSets, suggestion }, gIdx) => {
          const allDone = exSets.every((s) => s.isCompleted);
          const hasIncompleteInGroup = exSets.some((s) => !s.isCompleted);

          // Find the first incomplete group index
          const firstIncompleteIdx = grouped.findIndex(g => g.sets.some(s => !s.isCompleted));
          // The user's picked exercise, if still incomplete
          const pickedIdx = userPickedExId ? grouped.findIndex(g => g.exercise?.id === userPickedExId && g.sets.some(s => !s.isCompleted)) : -1;
          const activeIdx = pickedIdx >= 0 ? pickedIdx : firstIncompleteIdx;
          const isActive = gIdx === activeIdx;
          const isLocked = !allDone && !isActive;

          return (
            <View key={gIdx} style={[styles.group, allDone && { opacity: 0.55 }, isLocked && { opacity: 0.5 }]}>
              <View style={styles.groupHeader}>
                <TouchableOpacity
                  activeOpacity={isLocked ? 0.7 : 1}
                  disabled={!isLocked}
                  onPress={() => { if (isLocked) setUserPickedExId(exercise?.id ?? null); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Text style={[styles.groupName, allDone && { textDecorationLine: 'line-through' }]}>
                    {exercise?.name ?? 'Unknown'}
                  </Text>
                  <Text style={styles.groupCategory}>{exercise?.category}</Text>
                  {allDone && <Text style={{ color: Colors.green, fontSize: 14 }}>✓</Text>}
                  {isLocked && <Text style={{ fontSize: 13, color: Colors.tertiaryLabel }}>🔒 tap to start</Text>}
                </TouchableOpacity>
                {/* Skip — only for not-yet-completed exercises */}
                {!allDone && (
                  <TouchableOpacity onPress={() => skipExercise(exercise, exSets)} style={styles.skipBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.skipBtnLabel}>Skip</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Progressive overload hint */}
              {isActive && suggestion && lastSets.length > 0 && !allDone && (
                <View style={[styles.overloadHint, { backgroundColor: accentColor + '10', borderColor: accentColor + '30' }]}>
                  <Text style={styles.overloadIcon}>📈</Text>
                  <Text style={[styles.overloadText, { color: accentColor }]}>
                    Last time: {lastSets[0].weight} lbs × {lastSets[0].reps} reps
                    {suggestion.weight !== lastSets[0].weight || suggestion.reps !== lastSets[0].reps
                      ? `  →  Try ${suggestion.weight} lbs × ${suggestion.reps} reps`
                      : ' (maintain)'}
                  </Text>
                </View>
              )}

              {/* Sets — only show interactive rows when active or done; locked shows summary */}
              {(isActive || allDone) && exSets.map((set, sIdx) => (
                <SetRow
                  key={set.id}
                  set={set}
                  index={sIdx}
                  isCardio={exercise?.isCardio ?? false}
                  isTimed={exercise?.isTimed ?? false}
                  accentColor={accentColor}
                  suggestion={sIdx === 0 ? suggestion : null}
                  onUpdate={(updates) => saveWorkoutSet({ id: set.id, ...updates })}
                  onComplete={(weight, reps) => handleSetCompleted(set, exercise, weight, reps)}
                  onDelete={() => removeWorkoutSet(set.id)}
                />
              ))}
              {isLocked && (
                <Text style={{ fontSize: 12, color: Colors.tertiaryLabel, paddingVertical: 6 }}>
                  {exSets.length} set{exSets.length !== 1 ? 's' : ''} planned · {exercise?.isTimed ? 'timed hold' : exercise?.isCardio ? 'cardio' : `${exSets[0]?.reps ?? 10} reps`}
                </Text>
              )}

              {(isActive || allDone) && (
                <TouchableOpacity
                  style={[styles.addSetBtn, hasIncompleteInGroup && styles.addSetBtnDisabled]}
                  onPress={() => exercise && tryAddSet(exercise, exSets)}
                >
                  <Text style={[styles.addSetBtnLabel, { color: hasIncompleteInGroup ? Colors.tertiaryLabel : accentColor }]}>
                    {hasIncompleteInGroup ? `✓ Complete set ${exSets.length} first` : '＋ Add Set'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Add Exercise */}
        <TouchableOpacity
          style={[styles.addExBtn, { borderColor: hasIncompleteSets ? Colors.separator : accentColor }]}
          onPress={tryAddExercise}
        >
          <Text style={[styles.addExBtnLabel, { color: hasIncompleteSets ? Colors.tertiaryLabel : accentColor }]}>
            {hasIncompleteSets ? '🔒 Complete all sets to add exercise' : '＋ Add Exercise'}
          </Text>
        </TouchableOpacity>

        {/* Exercise picker — Library style with categories + favourites */}
        <Modal visible={showAddExercise} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowAddExercise(false)}>
          <View style={styles.picker}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Add Exercise</Text>
              <TouchableOpacity onPress={() => { setShowAddExercise(false); setSearch(''); setPickerCat('⭐'); }}>
                <Text style={styles.pickerClose}>Done</Text>
              </TouchableOpacity>
            </View>
            {/* Search */}
            <TextInput style={styles.pickerSearch} placeholder="Search exercises…" placeholderTextColor="#BBB" value={search} onChangeText={setSearch} />
            {/* Category chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}>
              {PICKER_CATS.map(c => {
                const active = pickerCat === c.key;
                return (
                  <TouchableOpacity key={c.key}
                    style={{ minWidth: 60, height: 32, paddingHorizontal: 14, borderRadius: 16,
                      backgroundColor: active ? c.color : c.color + '22',
                      borderWidth: 1.5, borderColor: c.color,
                      alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => { setPickerCat(c.key); setSearch(''); }}
                  >
                    <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '800', color: active ? '#fff' : c.color }}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Count */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#AAA' }}>
                {pickerCat === '⭐' ? `${favIds.length} saved` : `${pickerExercises.length} exercises`}
              </Text>
            </View>
            <ScrollView>
              {pickerCat === '⭐' && favIds.length === 0 && (
                <View style={{ alignItems: 'center', padding: 32 }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>☆</Text>
                  <Text style={{ color: '#AAA', textAlign: 'center' }}>Star exercises in your library to find them quickly here</Text>
                </View>
              )}
              {pickerExercises.map((ex) => {
                const isFav = favIds.includes(ex.id);
                const catColor = PICKER_CATS.find(c => c.key === ex.category)?.color ?? '#888';
                return (
                  <TouchableOpacity key={ex.id} style={[styles.pickerItem, isFav && { backgroundColor: '#FFFBEA' }]} onPress={() => { startCountdown(ex); setSearch(''); }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        {isFav && <Text style={{ fontSize: 12 }}>⭐</Text>}
                        <Text style={styles.pickerItemName}>{ex.name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <View style={{ backgroundColor: catColor + '18', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: catColor }}>{ex.category}</Text>
                        </View>
                        {ex.isCardio && <Text style={{ fontSize: 10, color: '#AAA' }}>Cardio</Text>}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => { startCountdown(ex); setSearch(''); }}
                      style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '300', lineHeight: 20 }}>＋</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Animated.View>
  );
}

// ─── Set Row ─────────────────────────────────────────────────────
interface SetRowProps {
  set: WorkoutSet;
  index: number;
  isCardio: boolean;
  isTimed?: boolean;
  accentColor: string;
  suggestion: { weight: number; reps: number } | null;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onComplete: (weight: number, reps: number) => void;
  onDelete: () => void;
}

function SetRow({ set, index, isCardio, isTimed, accentColor, suggestion, onUpdate, onComplete, onDelete }: SetRowProps) {
  const [weight, setWeight] = useState(suggestion?.weight ? String(suggestion.weight) : String(set.weight || ''));
  const [reps, setReps] = useState(suggestion?.reps ? String(suggestion.reps) : String(set.reps || ''));
  const [duration, setDuration] = useState(String(Math.floor((set.duration ?? 0) / 60)));
  const [holdSecs, setHoldSecs] = useState(String(set.duration ?? 0));
  const [distance, setDistance] = useState(String(set.distance ?? 0));
  // Live stopwatch for timed holds — wall-clock based so it stays accurate if backgrounded
  const [holdRunning, setHoldRunning] = useState(false);
  const [holdElapsed, setHoldElapsed] = useState(set.duration ?? 0);
  const holdStartRef = useRef<number>(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (holdRunning) {
      const update = () => setHoldElapsed(Math.floor((Date.now() - holdStartRef.current) / 1000));
      update();
      holdTimerRef.current = setInterval(update, 1000);
      const sub = AppState.addEventListener('change', (s) => { if (s === 'active') update(); });
      return () => { if (holdTimerRef.current) clearInterval(holdTimerRef.current); sub.remove(); };
    }
  }, [holdRunning]);

  function startHold() { holdStartRef.current = Date.now(); setHoldElapsed(0); setHoldRunning(true); }
  function stopHold() {
    setHoldRunning(false);
    const finalSecs = Math.floor((Date.now() - holdStartRef.current) / 1000);
    onUpdate({ duration: finalSecs, isCompleted: true });
  }

  function commit() {
    if (isTimed) {
      onUpdate({ duration: parseFloat(holdSecs) || 0 });
    } else if (isCardio) {
      onUpdate({ duration: (parseFloat(duration) || 0) * 60, distance: parseFloat(distance) || 0 });
    } else {
      onUpdate({ weight: parseFloat(weight) || 0, reps: parseInt(reps) || 0 });
    }
  }

  function handleComplete() {
    commit();
    if (isCardio || isTimed) {
      onUpdate({ isCompleted: true });
    } else {
      onComplete(parseFloat(weight) || 0, parseInt(reps) || 0);
    }
  }

  return (
    <View style={[styles.setRow, set.isCompleted && { backgroundColor: accentColor + '10', borderColor: accentColor + '25' }]}>
      <View style={[styles.setIndexBadge, { backgroundColor: set.isCompleted ? accentColor + '20' : '#F0F0F0' }]}>
        <Text style={[styles.setIndex, { color: set.isCompleted ? accentColor : Colors.secondaryLabel }]}>{index + 1}</Text>
      </View>

      {isTimed ? (
        set.isCompleted ? (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: accentColor, minWidth: 60 }}>{set.duration ?? 0}s</Text>
            <Text style={styles.setUnit}>held</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 22, fontWeight: '800', color: holdRunning ? accentColor : '#999', minWidth: 56 }}>{holdElapsed}s</Text>
            <TouchableOpacity
              onPress={holdRunning ? stopHold : startHold}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: holdRunning ? accentColor : accentColor + '15' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: holdRunning ? '#fff' : accentColor }}>
                {holdRunning ? '■ Stop & Save' : '▶ Start Hold'}
              </Text>
            </TouchableOpacity>
          </>
        )
      ) : isCardio ? (
        <>
          <TextInput style={[styles.setInput, set.isCompleted && styles.setInputDone]} value={duration} onChangeText={setDuration} onBlur={commit} keyboardType="decimal-pad" placeholder="min" placeholderTextColor="#CCC" editable={!set.isCompleted} />
          <Text style={styles.setUnit}>min</Text>
          <TextInput style={[styles.setInput, set.isCompleted && styles.setInputDone]} value={distance} onChangeText={setDistance} onBlur={commit} keyboardType="decimal-pad" placeholder="mi" placeholderTextColor="#CCC" editable={!set.isCompleted} />
          <Text style={styles.setUnit}>mi</Text>
        </>
      ) : (
        <>
          <TextInput style={[styles.setInput, set.isCompleted && styles.setInputDone]} value={weight} onChangeText={setWeight} onBlur={commit} keyboardType="decimal-pad" placeholder="lbs" placeholderTextColor="#CCC" editable={!set.isCompleted} />
          <Text style={styles.setUnit}>lbs</Text>
          <TextInput style={[styles.setInput, set.isCompleted && styles.setInputDone]} value={reps} onChangeText={setReps} onBlur={commit} keyboardType="number-pad" placeholder="reps" placeholderTextColor="#CCC" editable={!set.isCompleted} />
          <Text style={styles.setUnit}>reps</Text>
        </>
      )}

      {/* Check button — hidden for timed holds while in progress (Start/Stop handles it) */}
      {!(isTimed && !set.isCompleted) && (
        <TouchableOpacity
          onPress={set.isCompleted ? () => onUpdate({ isCompleted: false }) : handleComplete}
          style={[styles.checkBtn, { borderColor: set.isCompleted ? accentColor : '#DDD', backgroundColor: set.isCompleted ? accentColor : 'transparent' }]}
        >
          {set.isCompleted && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>}
        </TouchableOpacity>
      )}

      {!set.isCompleted && !(isTimed && holdRunning) && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteSetBtn}>
          <Text style={styles.deleteSetBtnLabel}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  countdownCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 16, minHeight: 280 },
  countdownExName: { fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },
  countdownLabel: { fontSize: 11, color: '#AAA', letterSpacing: 2, fontWeight: '700' },
  countdownNum: { fontSize: 96, fontWeight: '900', lineHeight: 110 },
  countdownSub: { fontSize: 13, color: '#BBB', fontStyle: 'italic' },
  skipBtn: { alignItems: 'center', gap: 2, padding: 10, paddingHorizontal: 24, backgroundColor: '#F5F5F5', borderRadius: 20 },
  skipBtnLabel: { color: '#888', fontWeight: '700', fontSize: 13 },
  skipBtnSub: { color: '#BBB', fontSize: 10, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  sessionName: { fontSize: 15, fontWeight: '700', color: '#111', flex: 1 },
  timer: { fontSize: 20, fontWeight: '800' },
  restInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restLabel: { fontSize: 8, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
  completeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  completeBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  discardBtn: { color: '#CCC', fontSize: 20, padding: 4 },
  progressRow: { gap: 5 },
  progressText: { fontSize: 11, color: '#888', fontWeight: '600' },
  progressTrack: { height: 3, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  restDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restDurationLabel: { fontSize: 9, fontWeight: '800', color: '#AAA', letterSpacing: 1, marginRight: 2 },
  restDurationChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F5F5F5' },
  restDurationChipLabel: { fontSize: 11, fontWeight: '700', color: '#888' },
  group: { gap: 6 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  skipBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#DDD' },
  skipBtnLabel: { fontSize: 12, fontWeight: '700', color: '#999' },
  groupName: { fontSize: 14, fontWeight: '700', color: '#111' },
  groupCategory: { fontSize: 11, color: '#AAA', flex: 1 },
  overloadHint: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 8, borderWidth: 1 },
  overloadIcon: { fontSize: 14 },
  overloadText: { fontSize: 11, fontWeight: '600', flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: 'transparent' },
  setIndexBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  setIndex: { fontSize: 11, fontWeight: '800' },
  setInput: { width: 50, fontSize: 15, fontWeight: '700', color: '#111', textAlign: 'center', borderBottomWidth: 1.5, borderBottomColor: '#E0E0E0', paddingBottom: 2 },
  setInputDone: { color: '#AAA', borderBottomColor: 'transparent' },
  setUnit: { fontSize: 11, color: '#BBB', width: 26 },
  checkBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  deleteSetBtn: { padding: 4 },
  deleteSetBtnLabel: { color: '#CCC', fontSize: 14 },
  addSetBtn: { alignSelf: 'flex-start', paddingVertical: 5 },
  addSetBtnDisabled: { opacity: 0.6 },
  addSetBtnLabel: { fontSize: 13, fontWeight: '700' },
  addExBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 13, alignItems: 'center' },
  addExBtnLabel: { fontWeight: '700', fontSize: 14 },
  picker: { flex: 1, backgroundColor: '#FAFAFA' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 64, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  pickerClose: { fontSize: 16, color: Colors.blue },
  pickerSearch: { margin: 12, padding: 12, backgroundColor: '#F5F5F5', borderRadius: 10, fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#EEE' },
  pickerSectionHeader: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8F8F8', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  pickerSectionTitle: { fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 1 },
  pickerItemFav: { backgroundColor: '#FFFBEA' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  pickerItemName: { fontSize: 15, color: '#111', fontWeight: '500' },
  pickerItemCat: { fontSize: 12, color: '#AAA', marginTop: 2 },
});
