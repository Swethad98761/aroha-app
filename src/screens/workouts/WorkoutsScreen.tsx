import React, { useState, useMemo } from 'react';
import { BodyWeightLogCard } from './BodyWeightLogCard';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme, cardStyle } from '../../theme';
import { TabHeader, EmptyState } from '../../components/SharedComponents';
import { WorkoutsConsistencyDashboard } from '../../components/ConsistencyDashboard';
import { WorkoutSession, WorkoutRoutine, Exercise } from '../../db/database';
import { formatTime, formatDateShort, isTodayDate } from '../../utils';
import { ActiveWorkoutCard } from './ActiveWorkoutCard';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { ManualWorkoutModal } from './ManualWorkoutModal';
import { EditWorkoutSessionModal } from './EditWorkoutSessionModal';
import { WorkoutStatsBar } from './WorkoutStatsBar';
import { StartWorkoutSheet } from './StartWorkoutSheet';
import { StepTrackerCard } from './StepTrackerCard';

const ACCENT = AppTheme.workouts.accentColor;

export default function WorkoutsScreen() {
  const { goals, workoutSessions, exercises, routines, startWorkoutSession, saveWorkoutSession, removeWorkoutSession } = useAppStore();
  const favouriteIds = require('../../db/stepTracker').getFavouriteIds();
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date());
  const [showHistoryCal, setShowHistoryCal] = useState(false);
  const [calHistMonth, setCalHistMonth] = useState(new Date());
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null);
  const [showRoutineMenu, setShowRoutineMenu] = useState(false);

  const activeSession = useMemo(() => workoutSessions.find((s) => !s.isCompleted) ?? null, [workoutSessions]);
  const completedSessions = useMemo(() => workoutSessions.filter((s) => s.isCompleted), [workoutSessions]);
  const workoutDates = workoutSessions.map((s) => s.date);
  const todaySeconds = useMemo(() => workoutSessions.filter((s) => isTodayDate(s.date)).reduce((sum, s) => sum + s.duration, 0), [workoutSessions]);

  async function handleStartNew(name?: string, routine?: WorkoutRoutine, startExercise?: Exercise) {
    // Don't start if there's already an active session
    if (activeSession) { setShowRoutineMenu(false); return; }
    const sessionName = name ?? (routine ? routine.name : `Workout – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    await startWorkoutSession(sessionName, routine, startExercise);
    setShowRoutineMenu(false);
  }

  function handleCompleteSession() {
    if (!activeSession) return;
    const duration = (Date.now() - new Date(activeSession.date).getTime()) / 1000;
    saveWorkoutSession({ id: activeSession.id, isCompleted: true, duration });
  }

  if (!goals) return null;

  return (
    <View style={styles.screen}>
      <TabHeader accentColor={ACCENT} />
      <ScrollView contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
        <View style={styles.inner}>

          <WorkoutsConsistencyDashboard
            goals={goals} accentColor={ACCENT}
            workoutDates={workoutDates} todaySeconds={todaySeconds}
          />

          <StepTrackerCard />

          {!activeSession && completedSessions.length > 0 && (
            <WorkoutStatsBar accentColor={ACCENT} onRepeat={(name) => handleStartNew(name)} />
          )}

          {activeSession ? (
            <ActiveWorkoutCard
              session={activeSession} exercises={exercises} accentColor={ACCENT}
              onComplete={handleCompleteSession}
              onDelete={() => removeWorkoutSession(activeSession.id)}
            />
          ) : (
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]}
              onPress={() => routines.length > 0 ? setShowRoutineMenu(true) : handleStartNew()}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnLabel}>▶  Start a New Workout</Text>
            </TouchableOpacity>
          )}

          <View style={styles.toolbar}>
            <TouchableOpacity onPress={() => setShowLibrary(true)}>
              <Text style={[styles.toolbarLink, { color: ACCENT }]}>📚 Exercise Library</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowManual(true)}>
              <Text style={[styles.toolbarLink, { color: Colors.green }]}>＋ Log Manual</Text>
            </TouchableOpacity>
          </View>

          <BodyWeightLogCard />
          {/* History with date picker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Workouts History</Text>
            <TouchableOpacity onPress={() => setShowHistoryCal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: ACCENT + '15' }}>
              <Text style={{ fontSize: 13 }}>📅</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>
                {historyDate.toDateString() === new Date().toDateString() ? 'Today' : formatDateShort(historyDate)}
              </Text>
            </TouchableOpacity>
          </View>
          {(() => {
            const daySessions = completedSessions.filter(s => new Date(s.date).toDateString() === historyDate.toDateString());
            if (completedSessions.length === 0) return <EmptyState icon="🏋️" title="No Workouts Yet" subtitle="Start a session to see your history" />;
            if (daySessions.length === 0) return (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>🏖️</Text>
                <Text style={{ fontSize: 14, color: Colors.secondaryLabel }}>Rest day — no workouts logged</Text>
              </View>
            );
            return (
              <View style={styles.list}>
                {daySessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    onPress={() => setEditSession(session)}
                    onLongPress={() => Alert.alert('Delete Workout?', '', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => removeWorkoutSession(session.id) },
                    ])}
                    style={styles.historyRow}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyName}>{session.name}</Text>
                      <Text style={styles.historyMeta}>{formatDateShort(session.date)} · {formatTime(session.duration)}</Text>
                      <Text style={styles.historyMeta}>{session.sets?.filter((s) => s.isCompleted).length ?? 0} sets completed</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}
          {/* Calendar modal */}
          <Modal visible={showHistoryCal} transparent animationType="fade" onRequestClose={() => setShowHistoryCal(false)}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', paddingHorizontal: 20 }}
              activeOpacity={1} onPress={() => setShowHistoryCal(false)}>
              <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => setCalHistMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n; })}>
                    <Text style={{ fontSize: 22, color: '#AAA', paddingHorizontal: 8 }}>‹</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1A1A' }}>
                    {calHistMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={() => setCalHistMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n; })}>
                    <Text style={{ fontSize: 22, color: '#AAA', paddingHorizontal: 8 }}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {['S','M','T','W','T','F','S'].map((d,i) => (
                    <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#BBB' }}>{d}</Text>
                  ))}
                </View>
                {(() => {
                  const year = calHistMonth.getFullYear();
                  const month = calHistMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month+1, 0).getDate();
                  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)];
                  while (cells.length % 7 !== 0) cells.push(null);
                  const rows = [];
                  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i+7));
                  return rows.map((row, ri) => (
                    <View key={ri} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      {row.map((day, di) => {
                        if (!day) return <View key={di} style={{ flex: 1, height: 38 }} />;
                        const d = new Date(year, month, day);
                        const hasWorkout = completedSessions.some(s => new Date(s.date).toDateString() === d.toDateString());
                        const isSelected = d.toDateString() === historyDate.toDateString();
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                          <TouchableOpacity key={di} style={{ flex: 1, height: 38, alignItems: 'center', justifyContent: 'center',
                            borderRadius: 10, backgroundColor: isSelected ? ACCENT : 'transparent' }}
                            onPress={() => { setHistoryDate(d); setShowHistoryCal(false); }}>
                            <Text style={{ fontSize: 14, fontWeight: isToday || isSelected ? '800' : '400',
                              color: isSelected ? '#fff' : isToday ? ACCENT : '#1A1A1A' }}>{day}</Text>
                            {hasWorkout && !isSelected && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACCENT, marginTop: 1 }} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ));
                })()}
                <TouchableOpacity onPress={() => { setHistoryDate(new Date()); setShowHistoryCal(false); }}
                  style={{ marginTop: 12, borderWidth: 1.5, borderColor: ACCENT + '40', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', color: ACCENT }}>Jump to Today</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </View>
      </ScrollView>

      <Modal visible={showRoutineMenu} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowRoutineMenu(false)}>
        <StartWorkoutSheet
          routines={routines}
          exercises={exercises}
          accentColor={ACCENT}
          lastWorkoutName={completedSessions[0]?.name}
          onClose={() => setShowRoutineMenu(false)}
          onStart={(name, routine, startExercise) => handleStartNew(name, routine, startExercise)}
        />
      </Modal>

      <ExerciseLibraryModal visible={showLibrary} onClose={() => setShowLibrary(false)} />
      <ManualWorkoutModal visible={showManual} onClose={() => setShowManual(false)} />
      {editSession && <EditWorkoutSessionModal session={editSession} onClose={() => setEditSession(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingBottom: 40 },
  inner: { paddingHorizontal: AppLayout.screenMargin, gap: AppLayout.sectionSpacing, paddingTop: AppLayout.sectionSpacing },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: AppLayout.cornerRadius, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  startBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toolbarLink: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.label },
  list: { gap: AppLayout.rowSpacing },
  historyRow: { ...cardStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  historyLeft: { flex: 1, gap: 3 },
  historyName: { fontSize: 15, fontWeight: '700', color: Colors.label },
  historyMeta: { fontSize: 12, color: Colors.secondaryLabel },
  chevron: { fontSize: 22, color: Colors.tertiaryLabel },
  menu: { flex: 1, backgroundColor: '#fff' },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  menuTitle: { fontSize: 18, fontWeight: '700', color: Colors.label },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  menuItemLabel: { fontSize: 16, color: Colors.label },
  menuSection: { fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1, padding: 16, paddingBottom: 8 },
});
