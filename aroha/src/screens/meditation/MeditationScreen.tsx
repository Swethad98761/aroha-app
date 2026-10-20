// src/screens/meditation/MeditationScreen.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme, cardStyle } from '../../theme';
import { TechLogoHeader, Card, EmptyState } from '../../components/SharedComponents';
import { MeditationConsistencyDashboard } from '../../components/ConsistencyDashboard';
import { formatMinSec, formatDateShort, isTodayDate } from '../../utils';
import { MeditationSession } from '../../db/database';

const ACCENT = AppTheme.meditation.accentColor;
const PRESETS = [5, 10, 15, 20, 30, 45, 60];

export default function MeditationScreen() {
  const { goals, meditationSessions, addMeditationSession, saveMeditationSession, removeMeditationSession } = useAppStore();

  const [targetMinutes, setTargetMinutes] = useState(15);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [showManual, setShowManual] = useState(false);
  const [editSession, setEditSession] = useState<MeditationSession | null>(null);

  const completedSessions = meditationSessions.filter((s) => s.isCompleted);
  const todaySeconds = completedSessions.filter((s) => isTodayDate(s.date)).reduce((sum, s) => sum + s.duration, 0);
  const medDates = completedSessions.map((s) => s.date);

  // Pulse animation while running
  useEffect(() => {
    if (timerState === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [timerState]);

  function startTimer() {
    const total = targetMinutes * 60;
    setSecondsLeft(total);
    setElapsed(0);
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimerState('done');
          setElapsed(total);
          addMeditationSession(total, true);
          return 0;
        }
        setElapsed((e) => e + 1);
        return prev - 1;
      });
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(intervalRef.current!);
    setTimerState('paused');
  }

  function resumeTimer() {
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimerState('done');
          addMeditationSession(elapsed + 1, true);
          return 0;
        }
        setElapsed((e) => e + 1);
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    Alert.alert('Stop Meditation?', 'Save partial session?', [
      { text: 'Discard', style: 'destructive', onPress: () => { clearInterval(intervalRef.current!); setTimerState('idle'); setSecondsLeft(0); setElapsed(0); } },
      { text: 'Save Progress', onPress: () => { clearInterval(intervalRef.current!); if (elapsed > 0) addMeditationSession(elapsed, false); setTimerState('idle'); setSecondsLeft(0); setElapsed(0); } },
      { text: 'Keep Going', style: 'cancel' },
    ]);
  }

  function resetTimer() {
    setTimerState('idle'); setSecondsLeft(0); setElapsed(0);
  }

  const totalSeconds = targetMinutes * 60;
  const progressFraction = timerState !== 'idle' ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const size = 200;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - Math.min(progressFraction, 1));

  if (!goals) return null;

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
      <TechLogoHeader title="Meditation" accentColor={ACCENT} />
      <View style={styles.inner}>
        <MeditationConsistencyDashboard goals={goals} accentColor={ACCENT} medDates={medDates} todaySeconds={todaySeconds} />

        {/* Timer Card */}
        <Card style={styles.timerCard}>
          {/* Preset selector */}
          {timerState === 'idle' && (
            <>
              <Text style={styles.presetLabel}>SET DURATION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
                {PRESETS.map((m) => (
                  <TouchableOpacity key={m} style={[styles.presetChip, targetMinutes === m && { backgroundColor: ACCENT }]} onPress={() => setTargetMinutes(m)}>
                    <Text style={[styles.presetLabel2, targetMinutes === m && { color: '#fff' }]}>{m}m</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Ring */}
          <Animated.View style={[styles.ringWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Svg width={size} height={size}>
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.secondaryBackground} strokeWidth={strokeWidth} fill="none" />
              <Circle
                cx={size / 2} cy={size / 2} r={r}
                stroke={timerState === 'done' ? Colors.green : ACCENT}
                strokeWidth={strokeWidth} fill="none"
                strokeDasharray={`${circ} ${circ}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation="-90" origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              {timerState === 'done' ? (
                <>
                  <Text style={[styles.ringCheck, { color: Colors.green }]}>✓</Text>
                  <Text style={styles.ringDoneLabel}>Complete</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.ringTime, { color: timerState !== 'idle' ? ACCENT : Colors.label }]}>
                    {timerState !== 'idle' ? formatMinSec(secondsLeft) : `${targetMinutes}:00`}
                  </Text>
                  <Text style={styles.ringSubtitle}>{timerState === 'idle' ? 'tap start' : timerState === 'paused' ? 'paused' : 'remaining'}</Text>
                </>
              )}
            </View>
          </Animated.View>

          {/* Controls */}
          <View style={styles.controls}>
            {timerState === 'idle' && (
              <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]} onPress={startTimer}>
                <Text style={styles.ctrlBtnLabel}>▶  Start</Text>
              </TouchableOpacity>
            )}
            {timerState === 'running' && (
              <View style={styles.ctrlRow}>
                <TouchableOpacity style={styles.ctrlBtnSm} onPress={pauseTimer}>
                  <Text style={styles.ctrlBtnSmLabel}>⏸</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: Colors.red }]} onPress={stopTimer}>
                  <Text style={styles.ctrlBtnLabel}>■  Stop</Text>
                </TouchableOpacity>
              </View>
            )}
            {timerState === 'paused' && (
              <View style={styles.ctrlRow}>
                <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: ACCENT }]} onPress={resumeTimer}>
                  <Text style={styles.ctrlBtnLabel}>▶  Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ctrlBtnSm} onPress={stopTimer}>
                  <Text style={styles.ctrlBtnSmLabel}>■</Text>
                </TouchableOpacity>
              </View>
            )}
            {timerState === 'done' && (
              <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: ACCENT }]} onPress={resetTimer}>
                <Text style={styles.ctrlBtnLabel}>↺  New Session</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* History header */}
        <View style={styles.histHeader}>
          <Text style={styles.sectionTitle}>Meditation History</Text>
          <TouchableOpacity onPress={() => setShowManual(true)}>
            <Text style={[styles.manualBtn, { color: Colors.blue }]}>＋ Log Manual</Text>
          </TouchableOpacity>
        </View>

        {completedSessions.length === 0 ? (
          <EmptyState icon="🧘‍♀️" title="No Sessions Yet" subtitle="Complete a meditation to see your history" />
        ) : (
          <View style={styles.list}>
            {completedSessions.map((session) => (
              <TouchableOpacity key={session.id} style={styles.sessionRow} onPress={() => setEditSession(session)} onLongPress={() => Alert.alert('Delete?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeMeditationSession(session.id) }])} activeOpacity={0.7}>
                <View>
                  <Text style={styles.sessionName}>Completed Practice</Text>
                  <Text style={styles.sessionMeta}>{formatDateShort(session.date)}</Text>
                </View>
                <Text style={[styles.sessionDuration, { color: ACCENT }]}>⏱ {formatMinSec(session.duration)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ManualMeditationModal visible={showManual} onClose={() => setShowManual(false)} />
      {editSession && <EditMeditationModal session={editSession} onClose={() => setEditSession(null)} />}
    </ScrollView>
  );
}

// ─── Manual Meditation Log ────────────────────────────────────────
function ManualMeditationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addMeditationSession } = useAppStore();
  const [duration, setDuration] = useState('15');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: Colors.blue, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.sheetTitle}>Manual Log</Text>
          <TouchableOpacity onPress={() => { addMeditationSession((parseFloat(duration) || 15) * 60, true); onClose(); }}>
            <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: AppLayout.screenMargin, gap: 16 }}>
          <View>
            <Text style={styles.fieldLabel}>Duration (minutes)</Text>
            <TextInput style={styles.fieldInput} value={duration} onChangeText={setDuration} keyboardType="decimal-pad" autoFocus />
          </View>
          <View>
            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.fieldInput} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Edit Meditation ──────────────────────────────────────────────
function EditMeditationModal({ session, onClose }: { session: MeditationSession; onClose: () => void }) {
  const { saveMeditationSession, removeMeditationSession } = useAppStore();
  const [duration, setDuration] = useState(String(Math.round(session.duration / 60)));

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: Colors.blue, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.sheetTitle}>Edit Session</Text>
          <TouchableOpacity onPress={() => { saveMeditationSession({ ...session, duration: (parseFloat(duration) || 0) * 60 }); onClose(); }}>
            <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: AppLayout.screenMargin, gap: 16 }}>
          <View>
            <Text style={styles.fieldLabel}>Duration (minutes)</Text>
            <TextInput style={styles.fieldInput} value={duration} onChangeText={setDuration} keyboardType="decimal-pad" autoFocus />
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => Alert.alert('Delete?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { removeMeditationSession(session.id); onClose(); } }])}>
            <Text style={styles.deleteBtnLabel}>🗑 Delete Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  inner: { paddingHorizontal: AppLayout.screenMargin, gap: AppLayout.sectionSpacing },
  timerCard: { alignItems: 'center', gap: 20 },
  presetLabel: { fontSize: 10, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1.2, alignSelf: 'flex-start' },
  presets: { gap: 8, paddingVertical: 4 },
  presetChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.secondaryBackground },
  presetLabel2: { fontSize: 14, fontWeight: '700', color: Colors.secondaryLabel },
  ringWrap: { position: 'relative', width: 200, height: 200 },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringCheck: { fontSize: 48, fontWeight: '700' },
  ringDoneLabel: { fontSize: 16, fontWeight: '700', color: Colors.green, marginTop: 4 },
  ringTime: { fontSize: 36, fontWeight: '800' },
  ringSubtitle: { fontSize: 13, color: Colors.secondaryLabel, fontWeight: '500', marginTop: 4 },
  controls: { width: '100%' },
  ctrlRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ctrlBtn: { flex: 1, paddingVertical: 14, borderRadius: AppLayout.cornerRadius, alignItems: 'center', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  ctrlBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctrlBtnSm: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.secondaryBackground, alignItems: 'center', justifyContent: 'center' },
  ctrlBtnSmLabel: { fontSize: 20 },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: '700' },
  manualBtn: { fontSize: 14, fontWeight: '700' },
  list: { gap: AppLayout.rowSpacing },
  sessionRow: { ...cardStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  sessionName: { fontSize: 15, fontWeight: '700', color: Colors.label },
  sessionMeta: { fontSize: 12, color: Colors.secondaryLabel, marginTop: 2 },
  sessionDuration: { fontSize: 16, fontWeight: '800' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel, marginBottom: 4 },
  fieldInput: { fontSize: 18, borderBottomWidth: 1, borderBottomColor: Colors.separator, paddingBottom: 6, color: Colors.label },
  deleteBtn: { marginTop: 12, padding: 14, backgroundColor: '#FF3B3010', borderRadius: AppLayout.cornerRadius, alignItems: 'center' },
  deleteBtnLabel: { color: Colors.red, fontWeight: '700', fontSize: 15 },
});
