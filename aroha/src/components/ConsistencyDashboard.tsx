// src/components/ConsistencyDashboard.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { Card, CircularProgressRing, WeeklyFractionRing, WeekDayDots } from './SharedComponents';
import { AppLayout, Colors } from '../theme';
import { UserGoals, WeightEntry } from '../db/database';
import { getCurrentWeekDays, isSameDay2, isTodayDate, formatTime } from '../utils';
import { useAppStore } from '../store/AppStore';

// ─── EditGoalsModal ────────────────────────────────────────────────
interface EditGoalsProps {
  visible: boolean;
  onClose: () => void;
  goals: UserGoals;
  tab: 'workouts' | 'yoga' | 'meditation';
}

export function EditGoalsModal({ visible, onClose, goals, tab }: EditGoalsProps) {
  const { updateGoals } = useAppStore();
  const [weeklyWorkout, setWeeklyWorkout] = useState(String(goals.weeklyWorkoutGoal));
  const [dailyDuration, setDailyDuration] = useState(String(goals.dailyDurationGoal));
  const [targetWeight, setTargetWeight] = useState(String(goals.targetWeight));
  const [weeklyYoga, setWeeklyYoga] = useState(String(goals.weeklyYogaGoal));
  const [dailyYoga, setDailyYoga] = useState(String(goals.dailyYogaDurationGoal));
  const [weeklyMed, setWeeklyMed] = useState(String(goals.weeklyMeditationGoal));
  const [dailyMed, setDailyMed] = useState(String(goals.dailyMeditationDurationGoal));

  function save() {
    updateGoals({
      weeklyWorkoutGoal: parseInt(weeklyWorkout) || goals.weeklyWorkoutGoal,
      dailyDurationGoal: parseFloat(dailyDuration) || goals.dailyDurationGoal,
      targetWeight: parseFloat(targetWeight) || goals.targetWeight,
      weeklyYogaGoal: parseInt(weeklyYoga) || goals.weeklyYogaGoal,
      dailyYogaDurationGoal: parseFloat(dailyYoga) || goals.dailyYogaDurationGoal,
      weeklyMeditationGoal: parseInt(weeklyMed) || goals.weeklyMeditationGoal,
      dailyMeditationDurationGoal: parseFloat(dailyMed) || goals.dailyMeditationDurationGoal,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Goals</Text>
          <TouchableOpacity onPress={save}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: AppLayout.screenMargin, gap: 16 }}>
          {(tab === 'workouts') && (
            <>
              <GoalField label="Weekly Workout Days" value={weeklyWorkout} onChange={setWeeklyWorkout} unit="days" />
              <GoalField label="Daily Duration Goal" value={dailyDuration} onChange={setDailyDuration} unit="min" />
              <GoalField label="Target Weight" value={targetWeight} onChange={setTargetWeight} unit="lbs" />
            </>
          )}
          {tab === 'yoga' && (
            <>
              <GoalField label="Weekly Yoga Days" value={weeklyYoga} onChange={setWeeklyYoga} unit="days" />
              <GoalField label="Daily Yoga Duration" value={dailyYoga} onChange={setDailyYoga} unit="min" />
            </>
          )}
          {tab === 'meditation' && (
            <>
              <GoalField label="Weekly Meditation Days" value={weeklyMed} onChange={setWeeklyMed} unit="days" />
              <GoalField label="Daily Meditation Duration" value={dailyMed} onChange={setDailyMed} unit="min" />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function GoalField({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <View style={styles.goalField}>
      <Text style={styles.goalLabel}>{label}</Text>
      <View style={styles.goalInputRow}>
        <TextInput
          style={styles.goalInput}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
        />
        <Text style={styles.goalUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ─── WeightLogModal ────────────────────────────────────────────────
interface WeightLogProps {
  visible: boolean;
  onClose: () => void;
  goals: UserGoals;
  initialWeight: number;
  accentColor: string;
}

export function WeightLogModal({ visible, onClose, goals, initialWeight, accentColor }: WeightLogProps) {
  const { addWeightEntry, weightEntries } = useAppStore();
  const [value, setValue] = useState(String(initialWeight));

  function save() {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      addWeightEntry(num);
      onClose();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Log Weight</Text>
          <TouchableOpacity onPress={save}><Text style={[styles.modalSave, { color: accentColor }]}>Save</Text></TouchableOpacity>
        </View>
        <View style={{ padding: AppLayout.screenMargin, gap: 16 }}>
          <View style={styles.goalField}>
            <Text style={styles.goalLabel}>Current Weight</Text>
            <View style={styles.goalInputRow}>
              <TextInput style={styles.goalInput} value={value} onChangeText={setValue} keyboardType="decimal-pad" autoFocus />
              <Text style={styles.goalUnit}>lbs</Text>
            </View>
          </View>
          <Text style={styles.weightTarget}>Target: {goals.targetWeight} lbs</Text>
          {weightEntries.slice(0, 5).map((w) => (
            <View key={w.id} style={styles.weightRow}>
              <Text style={styles.weightRowVal}>{w.value} lbs</Text>
              <Text style={styles.weightRowDate}>{new Date(w.date).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ─── WorkoutsConsistencyDashboard ──────────────────────────────────
interface WorkoutsDashProps {
  goals: UserGoals;
  accentColor: string;
  workoutDates: string[];
  todaySeconds: number;
}

export function WorkoutsConsistencyDashboard({ goals, accentColor, workoutDates, todaySeconds }: WorkoutsDashProps) {
  const { weightEntries } = useAppStore();
  const [showGoals, setShowGoals] = useState(false);
  const [showWeight, setShowWeight] = useState(false);

  const weekDays = getCurrentWeekDays();
  const activeDates = workoutDates.map((d) => new Date(d));
  const activeDaysThisWeek = weekDays.filter((wd) => activeDates.some((ad) => isSameDay2(ad, wd))).length;
  const todayProgress = goals.dailyDurationGoal > 0 ? todaySeconds / (goals.dailyDurationGoal * 60) : 0;
  const lastWeight = weightEntries[0]?.value ?? goals.currentWeight;
  const weightDiff = goals.targetWeight - lastWeight;

  return (
    <Card>
      {/* Header row */}
      <View style={styles.dashHeader}>
        <TouchableOpacity onPress={() => setShowGoals(true)} style={styles.dashGoalsBtn}>
          <Text style={styles.dashGoalsLabel}>CONSISTENCY GOALS</Text>
          <Text style={styles.dashChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowWeight(true)} style={[styles.weightPill, { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.weightPillText, { color: accentColor }]}>⚖ {lastWeight.toFixed(1)} lbs</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.weightHint}>
        {Math.abs(weightDiff).toFixed(1)} lbs {weightDiff > 0 ? 'to gain' : 'to lose'}
      </Text>

      {/* Progress row */}
      <View style={styles.dashRow}>
        <View style={styles.dashRingCol}>
          <CircularProgressRing
            progress={todayProgress}
            targetMinutes={goals.dailyDurationGoal}
            currentSeconds={todaySeconds}
            accentColor={accentColor}
          />
          <Text style={styles.dashTodayLabel}>TODAY</Text>
        </View>

        <View style={styles.dashDivider} />

        <View style={styles.dashWeeklyCol}>
          <Text style={styles.dashWeeklyLabel}>WEEKLY CONSISTENCY</Text>
          <View style={styles.dashWeeklyRow}>
            <WeekDayDots weekDays={weekDays} activeDays={activeDates} accentColor={accentColor} />
            <WeeklyFractionRing activeDays={activeDaysThisWeek} goalDays={goals.weeklyWorkoutGoal} accentColor={accentColor} />
          </View>
        </View>
      </View>

      <EditGoalsModal visible={showGoals} onClose={() => setShowGoals(false)} goals={goals} tab="workouts" />
      <WeightLogModal visible={showWeight} onClose={() => setShowWeight(false)} goals={goals} initialWeight={lastWeight} accentColor={accentColor} />
    </Card>
  );
}

// ─── YogaConsistencyDashboard ──────────────────────────────────────
interface YogaDashProps { goals: UserGoals; accentColor: string; yogaDates: string[]; }

export function YogaConsistencyDashboard({ goals, accentColor, yogaDates }: YogaDashProps) {
  const [showGoals, setShowGoals] = useState(false);
  const weekDays = getCurrentWeekDays();
  const activeDates = yogaDates.map((d) => new Date(d));
  const activeDaysThisWeek = weekDays.filter((wd) => activeDates.some((ad) => isSameDay2(ad, wd))).length;
  const doneToday = yogaDates.some((d) => isTodayDate(d));

  return (
    <Card>
      <View style={styles.dashHeader}>
        <TouchableOpacity onPress={() => setShowGoals(true)} style={styles.dashGoalsBtn}>
          <Text style={styles.dashGoalsLabel}>YOGA CONSISTENCY</Text>
          <Text style={styles.dashChevron}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dashRow}>
        <View style={styles.dashRingCol}>
          <CircularProgressRing progress={doneToday ? 1 : 0} targetMinutes={goals.dailyYogaDurationGoal} currentSeconds={doneToday ? goals.dailyYogaDurationGoal * 60 : 0} accentColor={accentColor} />
          <Text style={styles.dashTodayLabel}>TODAY</Text>
        </View>
        <View style={styles.dashDivider} />
        <View style={styles.dashWeeklyCol}>
          <Text style={styles.dashWeeklyLabel}>WEEKLY YOGA</Text>
          <View style={styles.dashWeeklyRow}>
            <WeekDayDots weekDays={weekDays} activeDays={activeDates} accentColor={accentColor} />
            <WeeklyFractionRing activeDays={activeDaysThisWeek} goalDays={goals.weeklyYogaGoal} accentColor={accentColor} />
          </View>
        </View>
      </View>
      <EditGoalsModal visible={showGoals} onClose={() => setShowGoals(false)} goals={goals} tab="yoga" />
    </Card>
  );
}

// ─── MeditationConsistencyDashboard ───────────────────────────────
interface MedDashProps { goals: UserGoals; accentColor: string; medDates: string[]; todaySeconds: number; }

export function MeditationConsistencyDashboard({ goals, accentColor, medDates, todaySeconds }: MedDashProps) {
  const [showGoals, setShowGoals] = useState(false);
  const weekDays = getCurrentWeekDays();
  const activeDates = medDates.map((d) => new Date(d));
  const activeDaysThisWeek = weekDays.filter((wd) => activeDates.some((ad) => isSameDay2(ad, wd))).length;
  const todayProgress = goals.dailyMeditationDurationGoal > 0 ? todaySeconds / (goals.dailyMeditationDurationGoal * 60) : 0;

  return (
    <Card>
      <View style={styles.dashHeader}>
        <TouchableOpacity onPress={() => setShowGoals(true)} style={styles.dashGoalsBtn}>
          <Text style={styles.dashGoalsLabel}>MEDITATION CONSISTENCY</Text>
          <Text style={styles.dashChevron}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dashRow}>
        <View style={styles.dashRingCol}>
          <CircularProgressRing progress={todayProgress} targetMinutes={goals.dailyMeditationDurationGoal} currentSeconds={todaySeconds} accentColor={accentColor} />
          <Text style={styles.dashTodayLabel}>TODAY</Text>
        </View>
        <View style={styles.dashDivider} />
        <View style={styles.dashWeeklyCol}>
          <Text style={styles.dashWeeklyLabel}>WEEKLY CONSISTENCY</Text>
          <View style={styles.dashWeeklyRow}>
            <WeekDayDots weekDays={weekDays} activeDays={activeDates} accentColor={accentColor} />
            <WeeklyFractionRing activeDays={activeDaysThisWeek} goalDays={goals.weeklyMeditationGoal} accentColor={accentColor} />
          </View>
        </View>
      </View>
      <EditGoalsModal visible={showGoals} onClose={() => setShowGoals(false)} goals={goals} tab="meditation" />
    </Card>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.label },
  modalCancel: { fontSize: 16, color: Colors.blue },
  modalSave: { fontSize: 16, fontWeight: '600', color: Colors.blue },
  goalField: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: AppLayout.cornerRadius, padding: 12,
  },
  goalLabel: { fontSize: 13, color: Colors.secondaryLabel, marginBottom: 8, fontWeight: '500' },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalInput: {
    flex: 1, fontSize: 22, fontWeight: '700', color: Colors.label,
    borderBottomWidth: 1, borderBottomColor: Colors.separator, paddingBottom: 4,
  },
  goalUnit: { fontSize: 14, color: Colors.secondaryLabel, fontWeight: '500' },
  weightTarget: { fontSize: 13, color: Colors.secondaryLabel },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  weightRowVal: { fontSize: 15, fontWeight: '600', color: Colors.label },
  weightRowDate: { fontSize: 13, color: Colors.secondaryLabel },
  dashHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  dashGoalsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dashGoalsLabel: { fontSize: 10, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1.2 },
  dashChevron: { fontSize: 14, color: Colors.secondaryLabel },
  weightPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  weightPillText: { fontSize: 11, fontWeight: '700' },
  weightHint: { fontSize: 9, color: Colors.secondaryLabel, fontWeight: '600', alignSelf: 'flex-end', marginBottom: 12 },
  dashRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dashRingCol: { alignItems: 'center', gap: 6 },
  dashTodayLabel: { fontSize: 9, fontWeight: '900', color: Colors.secondaryLabel, letterSpacing: 0.5 },
  dashDivider: { width: 1, height: 50, backgroundColor: Colors.separator },
  dashWeeklyCol: { flex: 1, gap: 6 },
  dashWeeklyLabel: { fontSize: 9, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 0.8 },
  dashWeeklyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
