import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useAuth } from '../../store/AuthStore';
import { useAppStore } from '../../store/AppStore';

const SAFFRON = '#FF6B00';

const GOALS = [
  { id: 'weightloss', emoji: '🔥', title: 'Lose Weight', sub: 'Burn fat, get lean' },
  { id: 'strength', emoji: '🔱', title: 'Build Strength', sub: 'Trishul-like power' },
  { id: 'flexibility', emoji: '🪷', title: 'Flexibility & Yoga', sub: 'Open body and mind' },
  { id: 'stress', emoji: 'ॐ', title: 'Stress Relief', sub: 'Inner peace, calm mind' },
  { id: 'overall', emoji: '🏔', title: 'Overall Wellness', sub: 'Balance of all prakritis' },
];

const ACTIVITY = [
  { id: 'sedentary', label: 'Sedentary', sub: 'Desk job, little movement' },
  { id: 'light', label: 'Lightly Active', sub: '1–2 workouts/week' },
  { id: 'moderate', label: 'Moderately Active', sub: '3–4 workouts/week' },
  { id: 'very', label: 'Very Active', sub: '5+ workouts/week' },
];

function inchesToFeet(inches: string): string {
  const n = parseFloat(inches);
  if (isNaN(n) || n <= 0) return '';
  const ft = Math.floor(n / 12);
  const inch = Math.round(n % 12);
  return `${ft}'${inch}"`;
}

export default function OnboardingScreen() {
  const { setOnboardingDone, username } = useAuth();
  const { updateGoals } = useAppStore();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['overall']);
  const [weight, setWeight] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [activity, setActivity] = useState('moderate');
  const [targetWeight, setTargetWeight] = useState('');

  const STEPS = ['goal', 'body', 'activity', 'targets'];
  const progress = (step + 1) / STEPS.length;

  function toggleGoal(id: string) {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function finish() {
    const hasStress = selectedGoals.includes('stress');
    const hasYoga = selectedGoals.includes('flexibility');
    const hasStrength = selectedGoals.includes('strength');
    const weeklyWorkout = activity === 'sedentary' ? 2 : activity === 'light' ? 3 : activity === 'moderate' ? 4 : 5;
    const weeklyYoga = hasYoga || hasStress ? 5 : 3;
    const weeklyMed = hasStress ? 7 : 5;
    const dailyDuration = hasStrength ? 60 : 45;
    updateGoals({
      weeklyWorkoutGoal: weeklyWorkout,
      dailyDurationGoal: dailyDuration,
      targetWeight: parseFloat(targetWeight) || parseFloat(weight) || 150,
      currentWeight: parseFloat(weight) || 150,
      weeklyYogaGoal: weeklyYoga,
      dailyYogaDurationGoal: hasYoga ? 45 : 30,
      weeklyMeditationGoal: weeklyMed,
      dailyMeditationDurationGoal: hasStress ? 20 : 15,
    });
    setOnboardingDone();
  }

  function next() {
    if (selectedGoals.length === 0) { return; }
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }

  const heightDisplay = inchesToFeet(heightInches);

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

        {step === 0 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>🙏</Text>
            <Text style={styles.stepTitle}>Welcome, {username}!</Text>
            <Text style={styles.stepSub}>What is your Sankalpam (संकल्पम्)?{'\n'}Select all that apply.</Text>
            <View style={styles.options}>
              {GOALS.map((g) => {
                const sel = selectedGoals.includes(g.id);
                return (
                  <TouchableOpacity key={g.id} style={[styles.optionCard, sel && styles.optionCardActive]} onPress={() => toggleGoal(g.id)}>
                    <Text style={styles.optionEmoji}>{g.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, sel && { color: SAFFRON }]}>{g.title}</Text>
                      <Text style={styles.optionSub}>{g.sub}</Text>
                    </View>
                    <View style={[styles.checkbox, sel && { backgroundColor: SAFFRON, borderColor: SAFFRON }]}>
                      {sel && <Text style={{ color: '#111', fontSize: 12 }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedGoals.length === 0 && <Text style={{ color: '#FF3B30', fontSize: 12, textAlign: 'center' }}>Please select at least one</Text>}
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>⚖️</Text>
            <Text style={styles.stepTitle}>Your Sharira (शरीर)</Text>
            <Text style={styles.stepSub}>Helps us personalize your journey</Text>
            <View style={styles.fields}>
              <View>
                <Text style={styles.fieldLabel}>Weight (lbs)</Text>
                <TextInput style={styles.fieldInput} value={weight} onChangeText={setWeight} placeholder="e.g. 160" keyboardType="decimal-pad" placeholderTextColor="#CCC" />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Height</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={heightInches}
                  onChangeText={setHeightInches}
                  placeholder="Enter inches e.g. 67"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#CCC"
                />
                {heightDisplay !== '' && (
                  <Text style={styles.heightDisplay}>{heightDisplay}</Text>
                )}
              </View>
              <View>
                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput style={styles.fieldInput} value={age} onChangeText={setAge} placeholder="e.g. 28" keyboardType="number-pad" placeholderTextColor="#CCC" />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.genderBtns}>
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                      <Text style={[styles.genderBtnLabel, gender === g && { color: SAFFRON }]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>🏃</Text>
            <Text style={styles.stepTitle}>Current Activity Level</Text>
            <Text style={styles.stepSub}>How active are you right now?</Text>
            <View style={styles.options}>
              {ACTIVITY.map((a) => {
                const sel = activity === a.id;
                return (
                  <TouchableOpacity key={a.id} style={[styles.optionCard, sel && styles.optionCardActive]} onPress={() => setActivity(a.id)}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, sel && { color: SAFFRON }]}>{a.label}</Text>
                      <Text style={styles.optionSub}>{a.sub}</Text>
                    </View>
                    <View style={[styles.checkbox, sel && { backgroundColor: SAFFRON, borderColor: SAFFRON }]}>
                      {sel && <Text style={{ color: '#111', fontSize: 12 }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>Your Lakshya (लक्ष्य)</Text>
            <Text style={styles.stepSub}>Set your target. Change anytime.</Text>
            <View style={styles.fields}>
              <View>
                <Text style={styles.fieldLabel}>Target Weight (lbs)</Text>
                <TextInput style={styles.fieldInput} value={targetWeight} onChangeText={setTargetWeight} placeholder={weight || '150'} keyboardType="decimal-pad" placeholderTextColor="#CCC" />
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Personalized Plan</Text>
              <Text style={styles.summaryGoals}>Goals: {selectedGoals.map((g) => GOALS.find((x) => x.id === g)?.title).join(' · ')}</Text>
              {[
                { label: '🔱 Weekly Workouts', val: activity === 'sedentary' ? '2 days' : activity === 'light' ? '3 days' : activity === 'moderate' ? '4 days' : '5 days' },
                { label: '🪷 Weekly Yoga', val: (selectedGoals.includes('flexibility') || selectedGoals.includes('stress')) ? '5 days' : '3 days' },
                { label: 'ॐ Weekly Meditation', val: selectedGoals.includes('stress') ? 'Daily' : '5 days' },
              ].map((item) => (
                <View key={item.label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryVal}>{item.val}</Text>
                </View>
              ))}
              <Text style={styles.summaryNote}>Auto-set based on your Sankalpam. Modify anytime in Goals.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.nextBtn, selectedGoals.length === 0 && step === 0 && { opacity: 0.4 }]} onPress={next} activeOpacity={0.85} disabled={selectedGoals.length === 0 && step === 0}>
        <Text style={styles.nextBtnLabel}>{step < STEPS.length - 1 ? 'Continue →' : 'Begin My Journey 🙏'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  progressTrack: { height: 3, backgroundColor: '#1A1A1A', marginTop: 56 },
  progressFill: { height: 3, backgroundColor: SAFFRON, borderRadius: 2 },
  inner: { padding: 24, paddingBottom: 120 },
  stepWrap: { gap: 20 },
  stepEmoji: { fontSize: 44, textAlign: 'center' },
  stepTitle: { fontSize: 26, fontWeight: '900', color: '#111', textAlign: 'center' },
  stepSub: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },
  options: { gap: 10 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#EEE' },
  optionCardActive: { borderColor: SAFFRON, backgroundColor: SAFFRON + '12' },
  optionEmoji: { fontSize: 26 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  optionSub: { fontSize: 12, color: '#AAA' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  fields: { gap: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, color: '#111', borderWidth: 1, borderColor: '#EEE' },
  heightDisplay: { fontSize: 22, fontWeight: '800', color: SAFFRON, marginTop: 8, textAlign: 'center' },
  genderBtns: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, padding: 12, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  genderBtnActive: { borderColor: SAFFRON },
  genderBtnLabel: { color: '#999', fontWeight: '700', fontSize: 13 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#EEE' },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: SAFFRON, letterSpacing: 0.5, marginBottom: 2 },
  summaryGoals: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#111' },
  summaryNote: { fontSize: 11, color: '#444', marginTop: 4, fontStyle: 'italic' },
  nextBtn: { position: 'absolute', bottom: 40, left: 24, right: 24, backgroundColor: SAFFRON, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: SAFFRON, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  nextBtnLabel: { color: '#111', fontWeight: '800', fontSize: 17 },
});
