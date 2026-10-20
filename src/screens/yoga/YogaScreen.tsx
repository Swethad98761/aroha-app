// src/screens/yoga/YogaScreen.tsx  (complete rewrite with Indian forms)
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Animated, Easing, TextInput, AppState,
} from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { Audio } from 'expo-av';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme, cardStyle } from '../../theme';
import { TabHeader, Card, EmptyState } from '../../components/SharedComponents';
import { YogaConsistencyDashboard } from '../../components/ConsistencyDashboard';
import { formatTime, formatDateShort } from '../../utils';
import { YogaSession } from '../../db/database';
import { YOGA_FORMS, YOGA_MUDRAS, getMudrasForForm, CHAKRA_COLORS, YogaForm, YogaMudra } from '../../data/yogaData';
import { AsanaLibraryModal } from './AsanaLibraryModal';

const ACCENT = AppTheme.yoga.accentColor;
const SAFFRON = '#FF6B00';

export default function YogaScreen() {
  const { goals, yogaSessions, asanas, addYogaSession, removeYogaSession } = useAppStore();

  const [activeForm, setActiveForm] = useState<YogaForm | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(null);
  const [activeMudraIndex, setActiveMudraIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [posePace, setPosePace] = useState(30); // default seconds per pose
  const [paused, setPaused] = useState(false);
  const [bellEnabled, setBellEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showFormPicker, setShowFormPicker] = useState(false);
  const [selectedMudra, setSelectedMudra] = useState<YogaMudra | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [editSession, setEditSession] = useState<YogaSession | null>(null);

  const yogaDates = yogaSessions.map((s) => s.date);

  useEffect(() => {
    if (activeStartDate) {
      const update = () => setElapsed(Math.floor((Date.now() - activeStartDate.getTime()) / 1000));
      update();
      intervalRef.current = setInterval(update, 1000);
      const sub = AppState.addEventListener('change', (s) => { if (s === 'active') update(); });
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); sub.remove(); };
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeStartDate]);

  function startForm(form: YogaForm) {
    setActiveForm(form);
    setActiveStartDate(new Date());
    setActiveMudraIndex(0);
    setElapsed(0);
    setPaused(false);
    setShowFormPicker(false);
  }

  function completeSession() {
    if (!activeForm) return;
    addYogaSession({ name: `${activeForm.name} Practice`, date: new Date().toISOString(), duration: elapsed, categories: [activeForm.name] });
    clearActive();
  }

  function clearActive() {
    setActiveForm(null); setActiveStartDate(null); setActiveMudraIndex(0); setElapsed(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  if (!goals) return null;
  const activeMudras = activeForm ? getMudrasForForm(activeForm.id) : [];
  const currentMudra = activeMudras[activeMudraIndex];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <TabHeader accentColor={ACCENT} />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <YogaConsistencyDashboard goals={goals} accentColor={ACCENT} yogaDates={yogaDates} />

        {activeForm && currentMudra ? (
          <ActiveYogaCard
            form={activeForm} mudras={activeMudras} currentIndex={activeMudraIndex}
            elapsed={elapsed}
            posePace={posePace}
            paused={paused}
            bellEnabled={bellEnabled}
            onToggleBell={() => setBellEnabled((b) => !b)}
            onTogglePause={() => setPaused((p) => !p)}
            isLast={activeMudraIndex === activeMudras.length - 1}
            onNext={() => setActiveMudraIndex((i) => Math.min(i + 1, activeMudras.length - 1))}
            onPrev={() => setActiveMudraIndex((i) => Math.max(i - 1, 0))}
            onAutoAdvance={() => {
              if (activeMudraIndex < activeMudras.length - 1) {
                setActiveMudraIndex((i) => i + 1);
              } else {
                setPaused(true); // reached the end — stop the flow
              }
            }}
            onViewMudra={setSelectedMudra}
            onComplete={() => Alert.alert('Complete Session?', `${formatTime(elapsed)} of ${activeForm.name}`, [{ text: 'Keep Going', style: 'cancel' }, { text: 'Finish 🙏', onPress: completeSession }])}
            onDiscard={() => Alert.alert('Discard?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: clearActive }])}
          />
        ) : (
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]} onPress={() => setShowFormPicker(true)} activeOpacity={0.85}>
            <Text style={styles.startBtnLabel}>🪷  Begin Yoga Practice</Text>
          </TouchableOpacity>
        )}

        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => setShowLibrary(true)}><Text style={[styles.toolbarLink, { color: ACCENT }]}>📚 Asana Library</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowManual(true)}><Text style={[styles.toolbarLink, { color: SAFFRON }]}>＋ Log Manual</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Yoga History</Text>
        {yogaSessions.length === 0
          ? <EmptyState icon="🧘" title="No Yoga Sessions Yet" subtitle="Begin a practice to see your history" />
          : <View style={styles.list}>
            {yogaSessions.map((s) => (
              <TouchableOpacity key={s.id} style={styles.sessionRow} onPress={() => setEditSession(s)} onLongPress={() => Alert.alert('Delete?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeYogaSession(s.id) }])} activeOpacity={0.7}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.sessionName}>{s.name}</Text>
                  <Text style={styles.sessionMeta}>{formatDateShort(s.date)} · {formatTime(s.duration)}</Text>
                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                    {s.categories.map((c) => <View key={c} style={[styles.catBadge, { backgroundColor: ACCENT + '20' }]}><Text style={[styles.catLabel, { color: ACCENT }]}>{c}</Text></View>)}
                  </View>
                </View>
                <Text style={{ fontSize: 22, color: Colors.tertiaryLabel }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      </View>

      {/* Form Picker */}
      <Modal visible={showFormPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFormPicker(false)}>
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Practice</Text>
            <TouchableOpacity onPress={() => setShowFormPicker(false)}><Text style={{ color: '#AAA', fontSize: 22 }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: AppLayout.screenMargin, gap: 14, paddingBottom: 40 }}>
            {/* Pace selector */}
            <View style={{ backgroundColor: '#F4F4F6', borderRadius: 14, padding: 14, gap: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A2E' }}>⏱ Hold each pose for</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[15, 30, 60].map((s) => {
                  const sel = posePace === s;
                  return (
                    <TouchableOpacity key={s} onPress={() => setPosePace(s)}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: sel ? ACCENT : '#FFFFFF', borderWidth: 1, borderColor: sel ? ACCENT : '#DDD' }}>
                      <Text style={{ color: sel ? '#fff' : '#555', fontWeight: '800', fontSize: 15 }}>{s}s</Text>
                      <Text style={{ color: sel ? '#fff' : '#888', fontSize: 10, marginTop: 2 }}>{s === 15 ? 'Quick' : s === 30 ? 'Steady' : 'Deep'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={{ fontSize: 11, color: '#999' }}>Each pose gives you ~5s to get into position, then holds for your chosen time. A soft bell 🔔 signals each change. Pause or skip anytime.</Text>
            </View>
            {YOGA_FORMS.map((form) => (
              <View key={form.id} style={styles.formCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 32 }}>{form.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A2E' }}>{form.name}</Text>
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{form.sanskrit}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#999' }}>{form.duration}</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#555', lineHeight: 20 }}>{form.description}</Text>
                <Text style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>📜 {form.origin}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {form.benefits.slice(0, 3).map((b) => (
                    <View key={b} style={{ backgroundColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, color: '#666' }}>✦ {b}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={[styles.startFormBtn, { backgroundColor: ACCENT }]} onPress={() => startForm(form)}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Begin {form.name} →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      </ScrollView>

      {selectedMudra && <MudraDetailModal mudra={selectedMudra} onClose={() => setSelectedMudra(null)} />}
      <AsanaLibraryModal visible={showLibrary} onClose={() => setShowLibrary(false)} />
      {showManual && <ManualYogaModal onClose={() => setShowManual(false)} />}
      {editSession && <EditYogaModal session={editSession} onClose={() => setEditSession(null)} />}
    </View>
  );
}

function ActiveYogaCard({ form, mudras, currentIndex, elapsed, posePace, paused, bellEnabled, onToggleBell, onTogglePause, isLast, onNext, onPrev, onAutoAdvance, onViewMudra, onComplete, onDiscard }: any) {
  const current = mudras[currentIndex];
  const chakraColor = CHAKRA_COLORS[current.chakra] ?? ACCENT;
  const progress = (currentIndex + 1) / mudras.length;

  const TRANSITION_SECS = 10; // time to get into the next position before the hold begins
  const holdSeconds = current.holdSeconds ?? posePace;

  // phase: 'transition' (getting into pose) -> 'hold' (the actual timed hold)
  const [phase, setPhase] = useState<'transition' | 'hold'>('transition');
  const [remaining, setRemaining] = useState(TRANSITION_SECS);
  const phaseStartRef = useRef<number>(Date.now());
  const phaseRef = useRef<'transition' | 'hold'>('transition');

  // Bell — single ring, reused from meditation's bowl
  async function ringBell() {
    if (!bellEnabled) return;
    let sound: Audio.Sound | null = null;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: false });
      const result = await Audio.Sound.createAsync(require('../../../assets/bowl.mp3'), { shouldPlay: true, volume: 0.6, isLooping: false });
      sound = result.sound;
      setTimeout(async () => { if (sound) { try { await sound.stopAsync(); } catch {} try { await sound.unloadAsync(); } catch {} } }, 4000);
    } catch (e) { if (sound) { try { await sound.unloadAsync(); } catch {} } }
  }

  // When the pose changes, restart with a transition phase + ring the bell (cue to move)
  useEffect(() => {
    setPhase('transition');
    phaseRef.current = 'transition';
    phaseStartRef.current = Date.now();
    setRemaining(TRANSITION_SECS);
    ringBell();
  }, [currentIndex]);

  // Track pause: when paused, remember remaining; when resumed, rebase the start time
  const pausedRemainingRef = useRef<number>(0);
  useEffect(() => {
    if (paused) {
      const phaseDur = phaseRef.current === 'transition' ? TRANSITION_SECS : holdSeconds;
      pausedRemainingRef.current = phaseDur - Math.floor((Date.now() - phaseStartRef.current) / 1000);
    } else {
      const phaseDur = phaseRef.current === 'transition' ? TRANSITION_SECS : holdSeconds;
      phaseStartRef.current = Date.now() - (phaseDur - pausedRemainingRef.current) * 1000;
    }
  }, [paused]);

  // Wall-clock countdown — survives backgrounding and catches up on resume
  useEffect(() => {
    if (paused) {
      // freeze: remember how much was left by resetting the start so resume continues
      return;
    }
    function recompute() {
      const phaseDur = phaseRef.current === 'transition' ? TRANSITION_SECS : holdSeconds;
      const elapsedPhase = Math.floor((Date.now() - phaseStartRef.current) / 1000);
      const left = phaseDur - elapsedPhase;
      if (left > 0) { setRemaining(left); return; }
      // phase finished
      if (phaseRef.current === 'transition') {
        phaseRef.current = 'hold';
        setPhase('hold');
        phaseStartRef.current = Date.now();
        setRemaining(holdSeconds);
      } else {
        onAutoAdvance(); // advances pose -> currentIndex effect restarts transition
      }
    }
    recompute();
    const tick = setInterval(recompute, 1000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') recompute(); });
    return () => { clearInterval(tick); sub.remove(); };
  }, [paused, currentIndex]);

  const totalForPhase = phase === 'transition' ? TRANSITION_SECS : holdSeconds;
  const ringPct = totalForPhase > 0 ? remaining / totalForPhase : 0;
  const isTransition = phase === 'transition';

  return (
    <Card style={[styles.activeCard, { borderColor: chakraColor + '50', borderWidth: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A2E' }}>{form.emoji} {form.name}</Text>
          <Text style={[{ fontSize: 22, fontWeight: '800', marginTop: 2 }, { color: chakraColor }]}>⏱ {formatTime(elapsed)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {/* Bell toggle icon */}
          <TouchableOpacity onPress={onToggleBell} style={{ opacity: bellEnabled ? 1 : 0.35 }}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.finishBtn, { backgroundColor: chakraColor }]} onPress={onComplete}><Text style={{ color: '#fff', fontWeight: '700' }}>✓ Finish</Text></TouchableOpacity>
          <TouchableOpacity onPress={onDiscard}><Text style={{ color: '#AAA', fontSize: 18 }}>✕</Text></TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 3, backgroundColor: '#EEEEEE', borderRadius: 2 }}>
        <View style={{ height: 3, width: `${progress * 100}%`, backgroundColor: chakraColor, borderRadius: 2 }} />
      </View>
      <Text style={{ fontSize: 11, color: '#999', textAlign: 'right' }}>{currentIndex + 1}/{mudras.length}</Text>

      {/* Figure with countdown ring */}
      <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
        <CountdownRing pct={ringPct} color={isTransition ? '#888888' : chakraColor} size={210} />
        <View style={{ position: 'absolute' }}>
          <YogaSilhouette mudraId={current.id} chakraColor={chakraColor} />
        </View>
        {/* Status badge */}
        <View style={{ position: 'absolute', bottom: 0, backgroundColor: paused ? '#666666' : isTransition ? '#888888' : chakraColor, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
            {paused ? '⏸ Paused' : isTransition ? `Get ready… ${remaining}s` : `Hold ${remaining}s`}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => onViewMudra(current)} style={[styles.mudraInfo, { backgroundColor: chakraColor + '15' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1A2E' }}>{current.name}</Text>
            <Text style={[{ fontSize: 12, marginTop: 2 }, { color: chakraColor }]}>{current.sanskrit}</Text>
          </View>
          <View style={[{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }, { backgroundColor: chakraColor }]}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{current.chakra.split(' ')[0]}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: '#555', marginTop: 6 }}>✦ {current.benefits[0]}</Text>
        <Text style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>→ {current.instructions[0]}</Text>
        <Text style={[{ fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 4 }, { color: chakraColor }]}>Tap for full details ›</Text>
      </TouchableOpacity>

      {/* Controls: Prev · Pause/Play · Next */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity style={[styles.navBtn, { opacity: currentIndex === 0 ? 0.3 : 1 }]} onPress={onPrev} disabled={currentIndex === 0}>
          <Text style={{ color: '#333', fontWeight: '700' }}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pauseBtn, { backgroundColor: chakraColor }]} onPress={onTogglePause}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{paused ? '▶ Resume' : '⏸ Pause'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, { opacity: isLast ? 0.3 : 1 }]} onPress={onNext} disabled={isLast}>
          <Text style={{ color: '#333', fontWeight: '700' }}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
        {mudras.map((_: any, i: number) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i === currentIndex ? chakraColor : i < currentIndex ? chakraColor + '60' : '#E0E0E0' }} />)}
      </View>
    </Card>
  );
}

// Circular countdown ring using SVG stroke-dashoffset
function CountdownRing({ pct, color, size }: { pct: number; color: string; size: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  // Track color: a faint version of the ring color. Guard against 3-digit hex.
  const trackColor = color.length >= 7 ? color + '22' : color;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

// Map pose id -> real silhouette image (only poses we have assets for)
const YOGA_POSE_IMAGES: Record<string, any> = {
  adho_mukha: require('../../../assets/yoga/adho_mukha.png'),
  vrikshasana: require('../../../assets/yoga/vrikshasana.png'),
  virabhadrasana2: require('../../../assets/yoga/virabhadrasana2.png'),
  padmasana: require('../../../assets/yoga/padmasana.png'),
  pranamasana: require('../../../assets/yoga/pranamasana.png'),
  hastauttanasana: require('../../../assets/yoga/hastauttanasana.png'),
  padahastasana: require('../../../assets/yoga/padahastasana.png'),
  dandasana: require('../../../assets/yoga/dandasana.png'),
  setu_bandha: require('../../../assets/yoga/setu_bandha.png'),
  ashwa_sanchalanasana: require('../../../assets/yoga/ashwa_sanchalanasana.png'),
  ashtanga_namaskar: require('../../../assets/yoga/ashtanga_namaskar.png'),
  bhujangasana: require('../../../assets/yoga/bhujangasana.png'),
  trikonasana: require('../../../assets/yoga/trikonasana.png'),
  virabhadrasana1: require('../../../assets/yoga/virabhadrasana1.png'),
  paschimottanasana: require('../../../assets/yoga/paschimottanasana.png'),
  matsyasana: require('../../../assets/yoga/matsyasana.png'),
  natarajasana: require('../../../assets/yoga/natarajasana.png'),
  kurmasana: require('../../../assets/yoga/kurmasana.png'),
  savasana: require('../../../assets/yoga/savasana.png'),
  surya_namaskar: require('../../../assets/yoga/surya_namaskar.png'),
};
// Fallback image for any pose without its own silhouette — a calm seated lotus
const YOGA_FALLBACK_IMAGE = require('../../../assets/yoga/padmasana.png');

function YogaSilhouette({ mudraId, chakraColor }: { mudraId: string; chakraColor: string }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.5, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, [mudraId]);

  const img = YOGA_POSE_IMAGES[mudraId] ?? YOGA_FALLBACK_IMAGE;
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.02] });
  const haloOpacity = glow.interpolate({ inputRange: [0.5, 1], outputRange: [0.12, 0.28] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 200, marginVertical: 6 }}>
      {/* Chakra-colored glow behind the figure */}
      <Animated.View style={{
        position: 'absolute', width: 150, height: 150, borderRadius: 75,
        backgroundColor: chakraColor, opacity: haloOpacity,
      }} />
      <Animated.View style={{
        position: 'absolute', width: 96, height: 96, borderRadius: 48,
        backgroundColor: chakraColor, opacity: Animated.multiply(haloOpacity, 1.4),
      }} />
      {/* Chakra overlay on top */}
      <Animated.Image
        source={img}
        style={{ width: 160, height: 160, resizeMode: 'contain', transform: [{ scale }] }}
      />
    </View>
  );
}

function MudraDetailModal({ mudra, onClose }: { mudra: YogaMudra; onClose: () => void }) {
  const chakraColor = CHAKRA_COLORS[mudra.chakra] ?? ACCENT;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: chakraColor + '30' }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: chakraColor, fontSize: 16, fontWeight: '700' }}>← Back</Text></TouchableOpacity>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: chakraColor }} />
        </View>
        <YogaSilhouette mudraId={mudra.id} chakraColor={chakraColor} />
        <View style={{ padding: AppLayout.screenMargin, gap: 20, paddingBottom: 60 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1A1A2E' }}>{mudra.name}</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: chakraColor, marginTop: 4 }}>{mudra.sanskrit}</Text>
            <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: chakraColor, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 8, backgroundColor: chakraColor + '15' }}>
              <Text style={{ color: chakraColor, fontSize: 13, fontWeight: '700' }}>⊛ {mudra.chakra}</Text>
            </View>
          </View>
          {[
            { title: 'Instructions', items: mudra.instructions },
            { title: 'Benefits (Phala)', items: mudra.benefits },
          ].map(({ title, items }) => (
            <View key={title} style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: chakraColor, letterSpacing: 1 }}>{title.toUpperCase()}</Text>
              {items.map((item, i) => <Text key={i} style={{ fontSize: 14, color: '#555', lineHeight: 22 }}>{i + 1}. {item}</Text>)}
            </View>
          ))}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: chakraColor, letterSpacing: 1 }}>BODY PARTS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {mudra.bodyParts.map((p) => <View key={p} style={{ backgroundColor: chakraColor + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ color: chakraColor, fontSize: 13, fontWeight: '600' }}>{p}</Text></View>)}
            </View>
          </View>
          {mudra.purana && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: chakraColor, letterSpacing: 1 }}>SCRIPTURAL REFERENCE</Text>
              <Text style={{ fontSize: 13, color: '#777', fontStyle: 'italic', lineHeight: 22 }}>📜 {mudra.purana}</Text>
            </View>
          )}
          {mudra.caution && (
            <View style={{ backgroundColor: '#FF3B3015', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FF3B3040' }}>
              <Text style={{ color: '#FF6B6B', fontSize: 13 }}>⚠️ {mudra.caution}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

function ManualYogaModal({ onClose }: { onClose: () => void }) {
  const { addYogaSession } = useAppStore();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: Colors.blue }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Log Manual Yoga</Text>
          <TouchableOpacity onPress={() => { addYogaSession({ name: name || 'Yoga Practice', date: new Date().toISOString(), duration: parseFloat(duration) * 60 || 0, categories: selectedForms }); onClose(); }}>
            <Text style={{ color: ACCENT, fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: AppLayout.screenMargin, gap: 14 }}>
          <View><Text style={styles.fieldLabel}>Name</Text><TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="Practice name" placeholderTextColor="#BBB" /></View>
          <View><Text style={styles.fieldLabel}>Duration (minutes)</Text><TextInput style={styles.fieldInput} value={duration} onChangeText={setDuration} keyboardType="decimal-pad" placeholderTextColor="#BBB" /></View>
          <Text style={styles.fieldLabel}>Forms Practiced</Text>
          {YOGA_FORMS.map((f) => { const sel = selectedForms.includes(f.name); return (
            <TouchableOpacity key={f.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#F4F4F6', borderRadius: 10, borderWidth: 1 }, { borderColor: sel ? ACCENT : '#E0E0E0' }]} onPress={() => setSelectedForms(sel ? selectedForms.filter((n) => n !== f.name) : [...selectedForms, f.name])}>
              <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              <Text style={[{ flex: 1, fontSize: 15, fontWeight: '600' }, { color: sel ? ACCENT : '#444' }]}>{f.name}</Text>
              {sel && <Text style={{ color: ACCENT }}>✓</Text>}
            </TouchableOpacity>
          ); })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function EditYogaModal({ session, onClose }: { session: YogaSession; onClose: () => void }) {
  const { saveYogaSession, removeYogaSession } = useAppStore();
  const [name, setName] = useState(session.name);
  const [duration, setDuration] = useState(String(Math.round(session.duration / 60)));
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: Colors.blue }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Session</Text>
          <TouchableOpacity onPress={() => { saveYogaSession({ ...session, name, duration: parseFloat(duration) * 60 }); onClose(); }}><Text style={{ color: ACCENT, fontWeight: '700' }}>Save</Text></TouchableOpacity>
        </View>
        <View style={{ padding: AppLayout.screenMargin, gap: 14 }}>
          <View><Text style={styles.fieldLabel}>Name</Text><TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholderTextColor="#BBB" /></View>
          <View><Text style={styles.fieldLabel}>Duration (min)</Text><TextInput style={styles.fieldInput} value={duration} onChangeText={setDuration} keyboardType="decimal-pad" placeholderTextColor="#BBB" /></View>
          <TouchableOpacity style={{ marginTop: 8, padding: 14, backgroundColor: '#FF3B3015', borderRadius: 12, alignItems: 'center' }} onPress={() => Alert.alert('Delete?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { removeYogaSession(session.id); onClose(); } }])}>
            <Text style={{ color: '#FF6B6B', fontWeight: '700' }}>🗑 Delete Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingBottom: 40 },
  inner: { paddingHorizontal: AppLayout.screenMargin, gap: AppLayout.sectionSpacing },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: AppLayout.cornerRadius, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  startBtnLabel: { color: '#fff', fontSize: 17, fontWeight: '800' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between' },
  toolbarLink: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: Colors.label },
  list: { gap: AppLayout.rowSpacing },
  sessionRow: { ...cardStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  sessionName: { fontSize: 15, fontWeight: '700', color: Colors.label },
  sessionMeta: { fontSize: 12, color: Colors.secondaryLabel },
  catBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  catLabel: { fontSize: 10, fontWeight: '700' },
  activeCard: { gap: 14, backgroundColor: '#FFFFFF' },
  finishBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  mudraInfo: { borderRadius: 12, padding: 14, gap: 6 },
  navBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F0F0F0', borderRadius: 20 },
  pauseBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 22 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#EEEEEE' },
  startFormBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.5, marginBottom: 4 },
  fieldInput: { backgroundColor: '#F4F4F6', borderRadius: 10, padding: 12, fontSize: 15, color: '#1A1A2E', borderWidth: 1, borderColor: '#E0E0E0' },
});
