// src/screens/workouts/WorkoutsScreen.tsx

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, FlatList,
} from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme, cardStyle } from '../../theme';
import { TechLogoHeader, Card, SectionTitle, EmptyState, PrimaryButton } from '../../components/SharedComponents';
import { WorkoutsConsistencyDashboard } from '../../components/ConsistencyDashboard';
import { WorkoutSession, WorkoutSet, Exercise, WorkoutRoutine } from '../../db/database';
import { formatTime, formatDateShort, isTodayDate, isSameDay2 } from '../../utils';
import { ActiveWorkoutCard } from './ActiveWorkoutCard';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { ManualWorkoutModal } from './ManualWorkoutModal';
import { EditWorkoutSessionModal } from './EditWorkoutSessionModal';

const ACCENT = AppTheme.workouts.accentColor;

export default function WorkoutsScreen() {
  const {
    goals, workoutSessions, exercises, routines,
    startWorkoutSession, saveWorkoutSession, removeWorkoutSession,
    weightEntries,
  } = useAppStore();

  const [showLibrary, setShowLibrary] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null);
  const [showRoutineMenu, setShowRoutineMenu] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null);

  const activeSession = useMemo(
    () => workoutSessions.find((s) => !s.isCompleted) ?? null,
    [workoutSessions]
  );

  const completedSessions = useMemo(
    () => workoutSessions.filter((s) => s.isCompleted),
    [workoutSessions]
  );

  const workoutDates = workoutSessions.map((s) => s.date);

  const todaySeconds = useMemo(() => {
    return workoutSessions
      .filter((s) => isTodayDate(s.date))
      .reduce((sum, s) => sum + s.duration, 0);
  }, [workoutSessions]);

  function handleStartNew(routine?: WorkoutRoutine) {
    const name = routine
      ? routine.name
      : `Workout – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    startWorkoutSession(name, routine);
    setShowRoutineMenu(false);
  }

  function handleCompleteSession() {
    if (!activeSession) return;
    const duration = (Date.now() - new Date(activeSession.date).getTime()) / 1000;
    saveWorkoutSession({ id: activeSession.id, isCompleted: true, duration });
  }

  function handleDeleteActive() {
    if (!activeSession) return;
    removeWorkoutSession(activeSession.id);
  }

  function confirmDelete(session: WorkoutSession) {
    Alert.alert('Delete Workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeWorkoutSession(session.id) },
    ]);
  }

  if (!goals) return null;

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
    >
      <TechLogoHeader title="Workouts" accentColor={ACCENT} />

      <View style={styles.inner}>
        <WorkoutsConsistencyDashboard
          goals={goals}
          accentColor={ACCENT}
          workoutDates={workoutDates}
          todaySeconds={todaySeconds}
        />

        {/* Active or Start Button */}
        {activeSession ? (
          <ActiveWorkoutCard
            session={activeSession}
            exercises={exercises}
            accentColor={ACCENT}
            onComplete={handleCompleteSession}
            onDelete={handleDeleteActive}
          />
        ) : (
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]}
            onPress={() => (routines.length > 0 ? setShowRoutineMenu(true) : handleStartNew())}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnIcon}>▶</Text>
            <Text style={styles.startBtnLabel}>Start a New Workout</Text>
          </TouchableOpacity>
        )}

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => setShowLibrary(true)}>
            <Text style={[styles.toolbarLink, { color: ACCENT }]}>📚 Exercise Library</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowManual(true)}>
            <Text style={[styles.toolbarLink, { color: Colors.green }]}>＋ Log Manual</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <SectionTitle>Workouts History</SectionTitle>
        {completedSessions.length === 0 ? (
          <EmptyState icon="🏋️" title="No Workouts Yet" subtitle="Start a session to see your history" />
        ) : (
          <View style={styles.list}>
            {completedSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => setEditSession(session)}
                onLongPress={() => confirmDelete(session)}
                style={styles.historyRow}
                activeOpacity={0.7}
              >
                <View style={styles.historyLeft}>
                  <Text style={styles.historyName}>{session.name}</Text>
                  <Text style={styles.historyMeta}>
                    {formatDateShort(session.date)} · {formatTime(session.duration)}
                  </Text>
                  <Text style={styles.historySetCount}>
                    {session.sets?.filter((s) => s.isCompleted).length ?? 0} sets completed
                  </Text>
                </View>
                <Text style={styles.historyChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Routine picker modal */}
      <Modal visible={showRoutineMenu} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowRoutineMenu(false)}>
        <View style={styles.menuModal}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Start Workout</Text>
            <TouchableOpacity onPress={() => setShowRoutineMenu(false)}>
              <Text style={styles.menuClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleStartNew()}>
              <Text style={styles.menuItemIcon}>＋</Text>
              <Text style={styles.menuItemLabel}>Start Empty Workout</Text>
            </TouchableOpacity>
            <Text style={styles.menuSection}>FROM ROUTINE</Text>
            {routines.map((r) => (
              <TouchableOpacity key={r.id} style={styles.menuItem} onPress={() => handleStartNew(r)}>
                <Text style={styles.menuItemIcon}>✦</Text>
                <Text style={styles.menuItemLabel}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <ExerciseLibraryModal visible={showLibrary} onClose={() => setShowLibrary(false)} />
      <ManualWorkoutModal visible={showManual} onClose={() => setShowManual(false)} />
      {editSession && (
        <EditWorkoutSessionModal
          session={editSession}
          onClose={() => setEditSession(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  inner: { paddingHorizontal: AppLayout.screenMargin, gap: AppLayout.sectionSpacing },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 15, borderRadius: AppLayout.cornerRadius,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4,
  },
  startBtnIcon: { color: '#fff', fontSize: 16 },
  startBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toolbarLink: { fontSize: 14, fontWeight: '700' },
  list: { gap: AppLayout.rowSpacing },
  historyRow: {
    ...cardStyle, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  historyLeft: { flex: 1, gap: 3 },
  historyName: { fontSize: 15, fontWeight: '700', color: Colors.label },
  historyMeta: { fontSize: 12, color: Colors.secondaryLabel },
  historySetCount: { fontSize: 12, color: Colors.secondaryLabel },
  historyChevron: { fontSize: 22, color: Colors.tertiaryLabel },
  menuModal: { flex: 1, backgroundColor: '#fff' },
  menuHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  menuTitle: { fontSize: 18, fontWeight: '700' },
  menuClose: { fontSize: 18, color: Colors.secondaryLabel },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  menuItemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuItemLabel: { fontSize: 16, color: Colors.label },
  menuSection: { fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1, padding: 16, paddingBottom: 8 },
});
