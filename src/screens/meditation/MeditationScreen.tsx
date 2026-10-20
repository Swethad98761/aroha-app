import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Animated, Easing, Alert, Dimensions, StatusBar, Image, AppState,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { MoodLogo } from '../../components/MoodLogo';
import { TabHeader } from '../../components/SharedComponents';
import { useAppStore } from '../../store/AppStore';
import { MEDITATION_TYPES, MeditationType } from '../../data/meditationData';
import { AppTheme } from '../../theme';

const ACCENT = AppTheme.meditation.accentColor;
const { width: W, height: H } = Dimensions.get('window');
const ORB_RING = 160;

// ─── Mantra breakdowns ───────────────────────────────────────────
const MANTRA_BREAKDOWNS: Record<string, { sanskrit: string; roman: string; meaning: string }[]> = {
  om_dhyana: [
    { sanskrit: 'ॐ', roman: 'Om', meaning: 'The primordial sound of the universe — all of creation, Brahman itself' },
  ],
  mantra_japa: [
    { sanskrit: 'ॐ', roman: 'Om', meaning: 'The absolute, Brahman — source of all' },
    { sanskrit: 'नमः', roman: 'Namah', meaning: 'I bow, I surrender completely' },
    { sanskrit: 'शिवाय', roman: 'Shivāya', meaning: 'To Shiva — the auspicious, the destroyer of ego' },
  ],
  soham: [
    { sanskrit: 'सः', roman: 'Sah', meaning: 'That — the infinite, Brahman, the universe' },
    { sanskrit: 'अहम्', roman: 'Aham', meaning: 'I am — the pure sense of being' },
    { sanskrit: 'सोऽहम्', roman: "So'Ham", meaning: 'I am That — the individual soul is the universal Self' },
  ],
  ajapa_japa: [
    { sanskrit: 'हम्', roman: 'Ham', meaning: 'Shiva — pure consciousness, the masculine principle' },
    { sanskrit: 'सः', roman: 'Sa', meaning: 'Shakti — pure energy, the feminine principle' },
    { sanskrit: 'हंस', roman: 'Hamsa', meaning: 'The swan — symbol of the Self that discerns truth from illusion' },
  ],
  gayatri_dhyana: [
    { sanskrit: 'ॐ', roman: 'Om', meaning: 'Brahman — the absolute reality' },
    { sanskrit: 'भूर्', roman: 'Bhūr', meaning: 'The physical plane, earth, the gross body' },
    { sanskrit: 'भुवः', roman: 'Bhuvaḥ', meaning: 'The vital / atmospheric plane, the breath' },
    { sanskrit: 'स्वः', roman: 'Svaḥ', meaning: 'The celestial plane, the mind and intellect' },
    { sanskrit: 'तत्', roman: 'Tat', meaning: 'That — the transcendent divine reality' },
    { sanskrit: 'सवितुः', roman: 'Savituḥ', meaning: 'Of Savitṛ, the solar deity — source of all light' },
    { sanskrit: 'वरेण्यम्', roman: 'Vareṇyam', meaning: 'Most worthy, most adorable, most excellent' },
    { sanskrit: 'भर्गः', roman: 'Bhargaḥ', meaning: 'The divine radiance, the purifying light' },
    { sanskrit: 'देवस्य', roman: 'Devasya', meaning: 'Of the divine, of God' },
    { sanskrit: 'धीमहि', roman: 'Dhīmahi', meaning: 'We meditate upon, we contemplate' },
    { sanskrit: 'धियः', roman: 'Dhiyaḥ', meaning: 'Our intellect, our understanding, our wisdom' },
    { sanskrit: 'यः', roman: 'Yaḥ', meaning: 'Which, who' },
    { sanskrit: 'नः', roman: 'Naḥ', meaning: 'Our, us' },
    { sanskrit: 'प्रचोदयात्', roman: 'Pracodayāt', meaning: 'May inspire, illuminate and guide forward' },
  ],
  maha_mrityunjaya: [
    { sanskrit: 'ॐ', roman: 'Om', meaning: 'Brahman — the absolute reality' },
    { sanskrit: 'त्र्यम्बकम्', roman: 'Tryambakam', meaning: 'The three-eyed one — Lord Shiva' },
    { sanskrit: 'यजामहे', roman: 'Yajāmahe', meaning: 'We worship, we adore' },
    { sanskrit: 'सुगन्धिम्', roman: 'Sugandhim', meaning: 'The fragrant one, sweet essence' },
    { sanskrit: 'पुष्टिवर्धनम्', roman: 'Puṣṭivardhanam', meaning: 'The nourisher, increaser of well-being' },
    { sanskrit: 'उर्वारुकमिव', roman: 'Urvārukam-iva', meaning: 'Like a ripe cucumber from its stem' },
    { sanskrit: 'बन्धनान्', roman: 'Bandhanān', meaning: 'From bondage, from attachment' },
    { sanskrit: 'मृत्योर्', roman: 'Mṛtyor', meaning: 'From death' },
    { sanskrit: 'मुक्षीय', roman: 'Mukṣīya', meaning: 'May we be liberated, freed' },
    { sanskrit: 'मामृतात्', roman: 'Mā-amṛtāt', meaning: 'But not from immortality — grant us deathlessness' },
  ],
  hare_krishna: [
    { sanskrit: 'हरे', roman: 'Hare', meaning: 'O divine energy of the Lord (Radha / Hari)' },
    { sanskrit: 'कृष्ण', roman: 'Kṛṣṇa', meaning: 'The all-attractive Supreme Being' },
    { sanskrit: 'राम', roman: 'Rāma', meaning: 'The reservoir of all pleasure, Lord Rama' },
  ],
  lokah_samastah: [
    { sanskrit: 'लोकाः', roman: 'Lokāḥ', meaning: 'All worlds, all realms' },
    { sanskrit: 'समस्ताः', roman: 'Samastāḥ', meaning: 'All together, in their entirety' },
    { sanskrit: 'सुखिनो', roman: 'Sukhino', meaning: 'Happy, content, joyful' },
    { sanskrit: 'भवन्तु', roman: 'Bhavantu', meaning: 'May they become, may they be' },
  ],
  chakra_dhyana: [
    { sanskrit: 'लं', roman: 'Laṃ', meaning: 'Mūlādhāra — Root chakra, earth element, security, survival' },
    { sanskrit: 'वं', roman: 'Vaṃ', meaning: 'Svādhiṣṭhāna — Sacral chakra, water, creativity, pleasure' },
    { sanskrit: 'रं', roman: 'Raṃ', meaning: 'Maṇipūra — Navel chakra, fire, power, will, digestion' },
    { sanskrit: 'यं', roman: 'Yaṃ', meaning: 'Anāhata — Heart chakra, air, love, compassion' },
    { sanskrit: 'हं', roman: 'Haṃ', meaning: 'Viśuddha — Throat chakra, space, truth, expression' },
    { sanskrit: 'ॐ', roman: 'Om', meaning: 'Ājñā — Third eye, light, intuition, wisdom, Shiva' },
  ],
  bhakti_dhyana: [
    { sanskrit: 'हरे', roman: 'Hare', meaning: "Hari's divine energy — Radha, the one who steals our hearts" },
    { sanskrit: 'कृष्ण', roman: 'Kṛṣṇa', meaning: 'The all-attractive one — the dark-complexioned Lord' },
    { sanskrit: 'राम', roman: 'Rāma', meaning: 'The one in whom all yogis delight — giver of bliss' },
  ],
  nada_yoga: [
    { sanskrit: 'नाद', roman: 'Nāda', meaning: 'Cosmic sound — the primal vibration underlying all existence' },
    { sanskrit: 'ब्रह्म', roman: 'Brahma', meaning: 'The absolute — God as pure vibration and sound' },
    { sanskrit: 'अनाहत', roman: 'Anāhata', meaning: 'Unstruck — the inner sound that arises without two things striking' },
  ],
  shambhavi: [
    { sanskrit: 'शाम्भव', roman: 'Śāmbhava', meaning: 'Of Śambhu (Shiva) — the benevolent, the auspicious Lord' },
    { sanskrit: 'मुद्रा', roman: 'Mudrā', meaning: 'Seal — a gesture that seals consciousness in a particular state' },
    { sanskrit: 'आज्ञा', roman: 'Ājñā', meaning: 'Third eye — the command center, seat of intuition and the Guru' },
  ],
  jnana_vichara: [
    { sanskrit: 'कोऽहम्', roman: "Ko'ham", meaning: 'Who am I? — the direct inquiry into the source of the ego' },
    { sanskrit: 'अहं ब्रह्मास्मि', roman: 'Ahaṃ Brahmāsmi', meaning: 'I am Brahman — the great Vedantic declaration of non-duality' },
    { sanskrit: 'तत् त्वम् असि', roman: 'Tat Tvam Asi', meaning: 'That thou art — you are identical with the absolute (Chandogya Up.)' },
  ],
  yoga_nidra: [
    { sanskrit: 'संकल्प', roman: 'Saṃkalpa', meaning: 'Heartfelt intention — plant it in the fertile soil of the subconscious' },
    { sanskrit: 'निद्रा', roman: 'Nidrā', meaning: 'Sleep — but here, conscious sleep, the witness remains awake' },
    { sanskrit: 'साक्षी', roman: 'Sākṣī', meaning: 'The pure witness — the one who sees without judgment or reaction' },
  ],
  vipassana: [
    { sanskrit: 'अनिच्च', roman: 'Anicca', meaning: 'Impermanence — all phenomena arise and pass; nothing is permanent' },
    { sanskrit: 'दुक्ख', roman: 'Dukkha', meaning: 'Suffering — clinging to the impermanent causes suffering' },
    { sanskrit: 'अनत्ता', roman: 'Anattā', meaning: 'Non-self — there is no fixed self; awareness itself is the truth' },
  ],
};


// What to speak for each practice — romanized, slow, devotional
const MANTRA_SPEECH: Record<string, { lines: string[]; pauseSecs: number }> = {
  om_dhyana: {
    lines: ['Aum... ', 'Aum... ', 'The primordial sound... breathe it in...', 'Aum...'],
    pauseSecs: 8,
  },
  mantra_japa: {
    lines: ['Om Namah Shivaya...', 'Om... Namah... Shivaya...', 'I bow to Shiva... the auspicious one...', 'Om Namah Shivaya...'],
    pauseSecs: 6,
  },
  soham: {
    lines: ['So... Ham...', 'I... am... That...', 'So on the inhale... Ham on the exhale...', 'So Ham... So Ham...'],
    pauseSecs: 6,
  },
  ajapa_japa: {
    lines: ['Hamsa... Hamsa...', 'Ham... on the inhale...', 'Sa... on the exhale...', 'The breath is the mantra...'],
    pauseSecs: 6,
  },
  gayatri_dhyana: {
    lines: [
      'Om Bhur Bhuva Swaha...',
      'Tat Savitur Varenyam...',
      'Bhargo Devasya Dhimahi...',
      'Dhiyo Yo Nah Prachodayat...',
      'We meditate on the divine light of the sun... may it illuminate our intellect...',
    ],
    pauseSecs: 10,
  },
  chakra_dhyana: {
    lines: ['Lam... Vam... Ram...', 'Yam... Ham... Om...', 'Feel each chakra awakening...', 'From root to crown...'],
    pauseSecs: 8,
  },
  bhakti_dhyana: {
    lines: ['Hare Krishna... Hare Rama...', 'Surrender in love...', 'Feel the divine presence in your heart...', 'Hare Om...'],
    pauseSecs: 8,
  },
  nada_yoga: {
    lines: ['Listen... to the inner sound...', 'Nada Brahma... God is sound...', 'The unstruck sound... Anahata...', 'Listen deeper...'],
    pauseSecs: 10,
  },
  shambhavi: {
    lines: ['Gently turn your gaze inward...', 'To the space between your eyebrows...', 'Shiva is there... pure awareness...', 'Rest in the light...'],
    pauseSecs: 10,
  },
  jnana_vichara: {
    lines: ['Who... am... I?', 'Not the body... not the mind...', 'Who is the one who witnesses?', 'Turn attention toward its own source...'],
    pauseSecs: 10,
  },
  yoga_nidra: {
    lines: ['Relax... the body is asleep...', 'But you remain awake...', 'Feel the right hand... the left hand...', 'You are the witness... pure awareness...'],
    pauseSecs: 12,
  },
  vipassana: {
    lines: ['Observe the breath... rising... falling...', 'Do not control it...', 'Simply watch... as the witness...', 'All sensations arise and pass...'],
    pauseSecs: 10,
  },
};

// ─── Mantra Audio (real chant recordings) ───────────────────────────
// Maps practice id → bundled chant audio + its duration in seconds.
// Only practices with a real recording are listed; others fall back to silent.
const MANTRA_AUDIO: Record<string, { file: any; durationSec: number }> = {
  om_dhyana:        { file: require('../../../assets/mantras/om.mp3'),               durationSec: 10 },
  mantra_japa:      { file: require('../../../assets/mantras/shivaya.mp3'),          durationSec: 14 },
  gayatri_dhyana:   { file: require('../../../assets/mantras/gayatri.mp3'),          durationSec: 49 },
  maha_mrityunjaya: { file: require('../../../assets/mantras/maha_mrityunjaya.mp3'), durationSec: 23 },
  hare_krishna:     { file: require('../../../assets/mantras/hare_krishna.mp3'),     durationSec: 82 },
  lokah_samastah:   { file: require('../../../assets/mantras/om.mp3'),   durationSec: 10 },
};

// ─── Orb Component ────────────────────────────────────────────────
function MeditationOrb({ color, symbol, phase, count, showCount, onTap }: {
  color: string; symbol: string; phase: string;
  count: number; showCount: boolean; onTap: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.35)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const tapPulse = useRef(new Animated.Value(0)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    anim.current?.stop();
    const expanding = phase === 'in' || phase === 'hold';
    const dur = phase === 'hold' || phase === 'rest' ? 1800 : 4000;
    anim.current = Animated.parallel([
      Animated.timing(scale, { toValue: expanding ? 1.15 : 1.0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: expanding ? 0.9 : 0.35, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]);
    anim.current.start();
  }, [phase]);

  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true })).start();
  }, []);

  useEffect(() => {
    Animated.timing(countOpacity, {
      toValue: showCount ? 1 : 0,
      duration: showCount ? 200 : 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [showCount]);

  function pulse() {
    tapPulse.setValue(0);
    Animated.timing(tapPulse, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    onTap();
  }

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const SIZE = 68;
  const RING1 = SIZE * 1.4;
  const RING2 = SIZE * 1.15;
  const pulseScale = tapPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const pulseOpacity = tapPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={pulse}
      style={{ width: RING1, height: RING1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2, borderColor: color, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }} />
      <Animated.View style={{ position: 'absolute', width: RING1, height: RING1, borderRadius: RING1 / 2, borderWidth: 1, borderColor: color, opacity: Animated.multiply(opacity, 0.25) }} />
      <Animated.View style={{ position: 'absolute', width: RING2, height: RING2, borderRadius: RING2 / 2, borderWidth: 1, borderColor: color, opacity: Animated.multiply(opacity, 0.45) }} />
      <Animated.View style={{
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        backgroundColor: '#0A0A0A',
        borderWidth: 1.5, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale }],
        shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 24, elevation: 10,
      }}>
        <Animated.View style={{
          position: 'absolute', width: SIZE * 0.72, height: SIZE * 0.72,
          borderRadius: SIZE, borderWidth: 0.5, borderColor: color,
          opacity: 0.25, transform: [{ rotate }],
        }} />
        <Animated.Text style={{ position: 'absolute', fontSize: SIZE * 0.3, fontFamily: 'serif', color, fontWeight: '300', opacity: countOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>{symbol}</Animated.Text>
        <Animated.Text style={{ position: 'absolute', fontSize: SIZE * 0.26, color, fontWeight: '400', opacity: countOpacity }}>{count}</Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Active Session ────────────────────────────────────────────────
function ActiveSession({ practice, totalSecs, bowlEnabled, stopwatch, onEnd }: {
  practice: MeditationType; totalSecs: number; bowlEnabled: boolean; stopwatch?: boolean; onEnd: (secs: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'rest'>('in');
  const [phaseLabel, setPhaseLabel] = useState('BREATHE IN');
  const [japaCount, setJapaCount] = useState(0);
  const [showMantra, setShowMantra] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [aiVoice, setAiVoice] = useState(false);
  const phaseRef = useRef(0);
  const phaseTickRef = useRef(0);
  const elapsedRef = useRef(0);
  const japaCountRef = useRef(0);
  const countHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiActiveRef = useRef(false);
  const color = practice.orbColor;
  const maxJapa = practice.japaCount ?? 108;

  // Briefly show the count number inside the orb, then fade it.
  // Only meaningful for japa practices.
  function flashCount() {
    if (!practice.hasJapa) return;
    setShowCount(true);
    if (countHideTimer.current) clearTimeout(countHideTimer.current);
    countHideTimer.current = setTimeout(() => setShowCount(false), 2000);
  }

  // Manual tap on the orb
  function handleOrbTap() {
    // If chant is actively playing → PAUSE it at current position (don't unload)
    if (aiVoice && aiActiveRef.current) {
      aiActiveRef.current = false;
      if (aiLoopRef.current) clearTimeout(aiLoopRef.current);
      if (mantraSoundRef.current) {
        mantraSoundRef.current.pauseAsync().catch(() => {});
      }
      return;
    }
    // Chant is ON but paused → RESUME from where it stopped
    if (aiVoice && !aiActiveRef.current) {
      aiActiveRef.current = true;
      if (mantraSoundRef.current) {
        // Resume the same audio from its paused position
        mantraSoundRef.current.playAsync().catch(() => {});
      } else {
        // No sound loaded (e.g. was between loops) → kick off a fresh loop
        setAiVoice(false);
        setTimeout(() => setAiVoice(true), 50);
      }
      return;
    }
    // No japa for this practice → nothing to count manually
    if (!practice.hasJapa) return;
    // Manual counting
    japaCountRef.current = Math.min(japaCountRef.current + 1, maxJapa);
    setJapaCount(japaCountRef.current);
    flashCount();
  }

  // Tap outside the orb → reveal current count for 2s (japa only)
  function handleOutsideTap() {
    flashCount();
  }

  const PHASES = [
    { p: 'in' as const, label: 'BREATHE IN', dur: 4 },
    { p: 'hold' as const, label: 'HOLD', dur: 4 },
    { p: 'out' as const, label: 'BREATHE OUT', dur: 4 },
    { p: 'rest' as const, label: 'REST', dur: 2 },
  ];

  async function playBowl() {
    let sound: Audio.Sound | null = null;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });
      // Local bundled Tibetan bowl — single ring, reliable offline
      const result = await Audio.Sound.createAsync(
        require('../../../assets/bowl.mp3'),
        { shouldPlay: true, volume: 0.7, isLooping: false }
      );
      sound = result.sound;
      // Let the single ring resonate fully and fade (~5s), then clean up
      setTimeout(async () => {
        if (sound) {
          try { await sound.stopAsync(); } catch {}
          try { await sound.unloadAsync(); } catch {}
          sound = null;
        }
      }, 5000);
    } catch (e) {
      if (sound) { try { await sound.unloadAsync(); } catch {} }
      console.log('Bowl error:', e);
    }
  }

  useEffect(() => {
    if (!running) return;
    // Wall-clock based: record the start moment, compute elapsed from real time.
    // This keeps the timer accurate even if the app is backgrounded (JS frozen).
    const startMs = Date.now() - elapsedRef.current * 1000;
    let lastBellSecond = Math.floor(elapsedRef.current / 30) * 30;

    function recompute() {
      const now = Math.floor((Date.now() - startMs) / 1000);
      elapsedRef.current = now;
      setElapsed(now);
      // Ring bell for any 30s boundaries we've crossed (only the latest, to avoid spamming on catch-up)
      if (bowlEnabled && now > 0) {
        const boundary = Math.floor(now / 30) * 30;
        if (boundary > lastBellSecond && boundary <= now) {
          lastBellSecond = boundary;
          playBowl();
        }
      }
      // Phase computation from absolute elapsed time
      const cycle = PHASES.reduce((a, p) => a + p.dur, 0);
      let t = now % cycle;
      let pi = 0;
      while (t >= PHASES[pi].dur) { t -= PHASES[pi].dur; pi = (pi + 1) % PHASES.length; }
      if (pi !== phaseRef.current) {
        phaseRef.current = pi;
        setPhase(PHASES[pi].p);
        setPhaseLabel(PHASES[pi].label);
      }
      if (now >= totalSecs) { onEnd(now); return true; }
      return false;
    }

    const tick = setInterval(() => { if (recompute()) clearInterval(tick); }, 1000);
    // Recompute immediately when app returns to foreground (catch up missed time)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') recompute();
    });
    return () => { clearInterval(tick); sub.remove(); };
  }, [running]);

  // ─── Mantra Audio: plays real chant, auto-counts each loop, 2s gap ───
  const mantraSoundRef = useRef<Audio.Sound | null>(null);
  useEffect(() => {
    let cancelled = false;

    async function stopMantra() {
      aiActiveRef.current = false;
      if (aiLoopRef.current) clearTimeout(aiLoopRef.current);
      if (mantraSoundRef.current) {
        try { await mantraSoundRef.current.stopAsync(); } catch {}
        try { await mantraSoundRef.current.unloadAsync(); } catch {}
        mantraSoundRef.current = null;
      }
    }

    if (!aiVoice || !running) {
      stopMantra();
      return;
    }

    const audio = MANTRA_AUDIO[practice.id];
    if (!audio) {
      // No recording for this practice
      return;
    }

    aiActiveRef.current = true;

    async function playLoop() {
      if (cancelled || !aiActiveRef.current) return;
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
        const { sound } = await Audio.Sound.createAsync(audio.file, { shouldPlay: true, volume: 0.85 });
        mantraSoundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            // One full chant completed → count it (japa practices only)
            if (practice.hasJapa && japaCountRef.current < maxJapa) {
              japaCountRef.current += 1;
              setJapaCount(japaCountRef.current);
              flashCount();
            }
            sound.unloadAsync().catch(() => {});
            mantraSoundRef.current = null;
            // Stop if reached target count
            if (practice.hasJapa && japaCountRef.current >= maxJapa) {
              aiActiveRef.current = false;
              return;
            }
            // 2-second gap then repeat
            if (aiActiveRef.current && !cancelled) {
              aiLoopRef.current = setTimeout(playLoop, 2000);
            }
          }
        });
      } catch (e) {
        console.log('Mantra audio error:', e);
      }
    }
    playLoop();

    return () => { cancelled = true; stopMantra(); };
  }, [aiVoice, running]);

  // Cleanup speech on unmount
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mantraSoundRef.current) {
        mantraSoundRef.current.stopAsync().catch(() => {});
        mantraSoundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const remaining = totalSecs - elapsed;
  const displaySecsTotal = stopwatch ? elapsed : remaining;
  const mins = Math.floor(displaySecsTotal / 60);
  const secs = displaySecsTotal % 60;
  const progress = stopwatch ? 0 : elapsed / totalSecs;
  const RING = ORB_RING;
  const sw = 2;
  const r = (RING - sw) / 2;
  const circ = 2 * Math.PI * r;
  const breakdown = MANTRA_BREAKDOWNS[practice.id] ?? [];

  return (
    <View style={[as.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Slim header */}
      <View style={as.header}>
        <View>
          <Text style={as.practiceName}>{practice.name}</Text>
          <Text style={[as.tradition, { color }]}>{practice.tradition}</Text>
        </View>
        <TouchableOpacity style={as.endBtn} onPress={() =>
          Alert.alert('End Session?', `${Math.floor(elapsed / 60)}m ${elapsed % 60}s completed`, [
            { text: 'Keep Going', style: 'cancel' },
            { text: 'End', style: 'destructive', onPress: () => onEnd(elapsed) },
          ])
        }>
          <Text style={as.endLabel}>End</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={as.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress arc + Orb — full width, centered */}
        <View style={as.orbWrap}>
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <Circle cx={RING / 2} cy={RING / 2} r={r} stroke="#F0F0F0" strokeWidth={sw} fill="none" />
            <Circle cx={RING / 2} cy={RING / 2} r={r}
              stroke={color} strokeWidth={sw} fill="none"
              strokeDasharray={`${circ} ${circ}`}
              strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round" rotation="-90" origin={`${RING / 2},${RING / 2}`}
            />
          </Svg>
          <MeditationOrb color={color} symbol={practice.orbSymbol} phase={phase}
            count={japaCount} showCount={showCount && !!practice.hasJapa} onTap={handleOrbTap} />
        </View>

        {/* Timer — large, thin weight · tap to peek at count */}
        <TouchableOpacity activeOpacity={0.7} onPress={handleOutsideTap}>
          <Text style={as.timer}>{mins}:{secs.toString().padStart(2, '0')}</Text>
        </TouchableOpacity>

        {/* Mantra if practice has one */}
        {practice.mantra && (
          <View style={[as.mantraBox, { borderColor: color + '20', backgroundColor: color + '05' }]}>
            {/* a) Sanskrit */}
            <Text style={[as.mantraText, { color }]}>{practice.mantra}</Text>
            {/* b) English pronunciation */}
            {MANTRA_BREAKDOWNS[practice.id] && (
              <Text style={[as.mantraRoman, { color: color + 'AA' }]}>
                {MANTRA_BREAKDOWNS[practice.id].map(w => w.roman).join(' · ')}
              </Text>
            )}
            {/* c) Button → word-by-word meaning */}
            <TouchableOpacity onPress={() => setShowMantra(true)} style={[as.breakdownBtn, { borderColor: color + '40' }]}>
              <Text style={[as.breakdownBtnLabel, { color }]}>Word-by-word meaning →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chant audio + counting controls — only for practices with a real recording */}
        {MANTRA_AUDIO[practice.id] && (
          <View style={as.japaSection}>
            <Text style={as.japaHint}>
              {aiVoice
                ? (practice.hasJapa ? 'Chanting & counting for you' : 'Chanting the mantra')
                : (practice.hasJapa ? `Tap the orb to count · ${maxJapa} mala` : 'Play the sacred chant')}
            </Text>

            {/* AI Voice controls */}
            <View style={as.aiRow}>
              {/* Toggle AI on/off */}
              <TouchableOpacity
                style={[as.aiToggle, { backgroundColor: aiVoice ? color : '#F0F0F0', borderColor: aiVoice ? color : '#DDD' }]}
                onPress={() => setAiVoice(v => !v)}
              >
                <Text style={{ fontSize: 14 }}>{aiVoice ? '🔊' : '🔈'}</Text>
                <Text style={[as.aiToggleLabel, { color: aiVoice ? '#fff' : '#666' }]}>
                  {aiVoice ? 'Chant Playing' : 'Play Chant'}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

        {/* Steps */}
        <View style={[as.stepsBox, { borderColor: color + '15' }]}>
          <Text style={[as.stepsTitle, { color: color + '80' }]}>PRACTICE STEPS</Text>
          {practice.steps.map((s, i) => (
            <View key={i} style={as.stepRow}>
              <Text style={[as.stepNum, { color }]}>{i + 1}</Text>
              <Text style={as.stepText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Scripture */}
        <View style={[as.scripture, { borderLeftColor: color }]}>
          <Text style={as.scriptureText}>{practice.scriptureRef}</Text>
        </View>

        {/* Pause */}
        <TouchableOpacity
          style={[as.pauseBtn, { borderColor: color, backgroundColor: running ? '#FAFAFA' : color }]}
          onPress={() => setRunning(r => !r)}
        >
          <Text style={[as.pauseLabel, { color: running ? color : '#fff' }]}>
            {running ? '⏸  Pause' : '▶  Resume'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Mantra breakdown modal */}
      <Modal visible={showMantra} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMantra(false)}>
        <View style={mb.screen}>
          <View style={mb.header}>
            <Text style={mb.title}>Word-by-Word Meaning</Text>
            <TouchableOpacity onPress={() => setShowMantra(false)}>
              <Text style={mb.close}>Done</Text>
            </TouchableOpacity>
          </View>
          {practice.mantra && (
            <Text style={[mb.mantraFull, { color }]}>{
              practice.id === 'gayatri_dhyana'
                ? 'ॐ भूर्भुवः स्वः\nतत् सवितुर् वरेण्यम्\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात्'
                : practice.mantra
            }</Text>
          )}
          <ScrollView contentContainerStyle={mb.content}>
            {breakdown.map((w, i) => (
              <View key={i} style={[mb.wordRow, { borderLeftColor: color }]}>
                <Text style={[mb.wordSanskrit, { color }]}>{w.sanskrit}</Text>
                <Text style={mb.wordRoman}>{w.roman}</Text>
                <Text style={mb.wordMeaning}>{w.meaning}</Text>
              </View>
            ))}
            <View style={[mb.scriptureBox, { backgroundColor: color + '08', borderColor: color + '25' }]}>
              <Text style={[mb.scriptureLabel, { color }]}>SOURCE</Text>
              <Text style={mb.scriptureText}>{practice.scriptureRef}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const as = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  practiceName: { fontSize: 17, fontWeight: '700', color: '#111' },
  tradition: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  endBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F5F5F5', borderRadius: 20 },
  endLabel: { color: '#888', fontSize: 13, fontWeight: '600' },
  scroll: { alignItems: 'center', paddingBottom: 60, gap: 16, paddingTop: 8 },
  orbWrap: { width: ORB_RING, height: ORB_RING, alignItems: 'center', justifyContent: 'center' },
  timer: { fontSize: 44, fontWeight: '200', color: '#111', letterSpacing: -2, lineHeight: 44 },
  phaseRow: { alignItems: 'center' },
  phaseLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 4 },
  mantraBox: { width: W - 40, borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'center', gap: 10 },
  mantraText: { fontSize: 28, fontFamily: 'serif', fontWeight: '300', textAlign: 'center', lineHeight: 40, letterSpacing: 2 },
  mantraSmall: { fontSize: 14, fontFamily: 'serif', textAlign: 'center', lineHeight: 24 },
  breakdownBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  breakdownBtnLabel: { fontSize: 12, fontWeight: '600' },
  japaSection: { width: W - 40, alignItems: 'center', gap: 12 },
  japaHint: { fontSize: 12, color: '#999', fontWeight: '500', textAlign: 'center' },
  aiRow: { alignItems: 'center', gap: 10 },
  aiToggle: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5 },
  aiToggleLabel: { fontSize: 13, fontWeight: '700' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5 },
  genderLabel: { fontSize: 12, fontWeight: '700' },
  japaCount: { fontSize: 40, fontWeight: '200', letterSpacing: -2 },
  japaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#AAA' },
  malaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', maxWidth: W - 40 },
  malaDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  japaBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, marginTop: 4 },
  japaBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  stepsBox: { width: W - 40, borderRadius: 16, padding: 16, borderWidth: 1, backgroundColor: '#fff', gap: 10 },
  stepsTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { fontSize: 12, fontWeight: '800', width: 20, marginTop: 1 },
  stepText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 21 },
  scripture: { width: W - 40, borderLeftWidth: 2, paddingLeft: 12, paddingVertical: 4 },
  scriptureText: { fontSize: 12, color: '#888', fontStyle: 'italic', lineHeight: 18 },
  mantraEnglishLine: { fontSize: 13, color: '#888', textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  mantraRoman: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  mantraEnglishSummary: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 16 },
  pauseBtn: { width: W - 40, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1.5 },
  pauseLabel: { fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
});

const mb = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 17, fontWeight: '700', color: '#111' },
  close: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  mantraFull: { fontSize: 20, fontFamily: 'serif', textAlign: 'center', padding: 20, lineHeight: 34, letterSpacing: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  wordRow: { borderLeftWidth: 2, paddingLeft: 14, paddingVertical: 8, gap: 2 },
  wordSanskrit: { fontSize: 20, fontFamily: 'serif', fontWeight: '400' },
  wordRoman: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  wordMeaning: { fontSize: 13, color: '#444', lineHeight: 19 },
  scriptureBox: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  scriptureLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  scriptureText: { fontSize: 13, color: '#555', fontStyle: 'italic', lineHeight: 20 },
});

// ─── Timer Picker ──────────────────────────────────────────────────
function TimerPicker({ practice, onStart, onClose }: {
  practice: MeditationType;
  onStart: (secs: number, bowl: boolean, stopwatch?: boolean) => void;
  onClose: () => void;
}) {
  const color = practice.orbColor;
  // Always offer short options (1,2,3,5 min) merged with the practice's own durations
  const SHORT = [60, 120, 180, 300];
  const durations = Array.from(new Set([...SHORT, ...practice.durations])).sort((a, b) => a - b);
  const [selected, setSelected] = useState(durations[2] ?? practice.duration);
  const [bowl, setBowl] = useState(true);
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const STOPWATCH_SECS = 3600; // open-ended; user ends manually

  return (
    <View style={tp.screen}>
      <View style={tp.topBar}>
        <TouchableOpacity onPress={onClose} style={tp.closeBtn}>
          <Text style={tp.closeBtnLabel}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={tp.content} showsVerticalScrollIndicator={false}>
        {/* Practice header */}
        <View style={tp.practiceHeader}>
          <Text style={tp.emoji}>{practice.emoji}</Text>
          <Text style={tp.name}>{practice.name}</Text>
          <Text style={tp.sanskrit}>{practice.sanskrit}</Text>
          <View style={[tp.accentLine, { backgroundColor: color }]} />
          <Text style={tp.desc}>{practice.description}</Text>
        </View>

        {/* Mode: Stopwatch (open) or Timer (preset) */}
        <Text style={[tp.sectionLabel, { color }]}>SESSION</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <TouchableOpacity
            style={[tp.modeCard, { borderColor: mode === 'stopwatch' ? color : '#E8E8E8', backgroundColor: mode === 'stopwatch' ? color + '0E' : '#fff' }]}
            onPress={() => setMode('stopwatch')}
          >
            <Text style={{ fontSize: 26 }}>⏱️</Text>
            <Text style={[tp.modeTitle, { color: mode === 'stopwatch' ? color : '#111' }]}>Stopwatch</Text>
            <Text style={tp.modeSub}>Open-ended · end when ready</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[tp.modeCard, { borderColor: mode === 'timer' ? color : '#E8E8E8', backgroundColor: mode === 'timer' ? color + '0E' : '#fff' }]}
            onPress={() => setMode('timer')}
          >
            <Text style={{ fontSize: 26 }}>⏲️</Text>
            <Text style={[tp.modeTitle, { color: mode === 'timer' ? color : '#111' }]}>Timer</Text>
            <Text style={tp.modeSub}>Set a fixed length</Text>
          </TouchableOpacity>
        </View>

        {/* Timer durations — only when timer mode */}
        {mode === 'timer' && (
          <View style={[tp.durRow, { flexWrap: 'wrap' }]}>
            {durations.map(d => {
              const active = selected === d;
              const mins = Math.round(d / 60);
              return (
                <TouchableOpacity key={d}
                  style={[tp.durChip, { borderColor: active ? color : '#E8E8E8', backgroundColor: active ? color : '#fff' }]}
                  onPress={() => setSelected(d)}
                >
                  <Text style={[tp.durMins, { color: active ? '#fff' : '#111' }]}>{mins}</Text>
                  <Text style={[tp.durLabel, { color: active ? 'rgba(255,255,255,0.7)' : '#AAA' }]}>min</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bell toggle — icon only */}
        <TouchableOpacity style={tp.bowlRow} onPress={() => setBowl(b => !b)}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
          <View style={[tp.toggle, { backgroundColor: bowl ? color : '#DDD' }]}>
            <View style={[tp.thumb, { transform: [{ translateX: bowl ? 16 : 0 }] }]} />
          </View>
        </TouchableOpacity>

        {/* Steps preview */}
        <Text style={[tp.sectionLabel, { color }]}>HOW TO PRACTICE</Text>
        {practice.steps.map((s, i) => (
          <View key={i} style={tp.stepRow}>
            <View style={[tp.stepNum, { backgroundColor: color + '18' }]}>
              <Text style={[tp.stepNumLabel, { color }]}>{i + 1}</Text>
            </View>
            <Text style={tp.stepText}>{s}</Text>
          </View>
        ))}

        {/* Mantra preview */}
        {practice.mantra && (
          <>
            <Text style={[tp.sectionLabel, { color }]}>MANTRA</Text>
            <View style={[tp.mantraBox, { borderColor: color + '25', backgroundColor: color + '06' }]}>
              <Text style={[tp.mantraText, { color }]}>{practice.mantra}</Text>
              <Text style={tp.mantraRoman}>{MANTRA_BREAKDOWNS[practice.id]?.map(w => w.roman).join(' · ') ?? ''}</Text>
            </View>
          </>
        )}

        {/* Benefits */}
        <Text style={[tp.sectionLabel, { color }]}>BENEFITS</Text>
        {practice.benefits.map((b, i) => (
          <View key={i} style={tp.benefitRow}>
            <View style={[tp.benefitDot, { backgroundColor: color }]} />
            <Text style={tp.benefitText}>{b}</Text>
          </View>
        ))}

        {/* CTA */}
        <TouchableOpacity style={[tp.startBtn, { backgroundColor: color }]} onPress={() => onStart(mode === 'stopwatch' ? STOPWATCH_SECS : selected, bowl, mode === 'stopwatch')}>
          <Text style={tp.startLabel}>
            {mode === 'stopwatch' ? `Begin  ·  ${practice.name}` : `Begin ${Math.round(selected / 60)} min  ·  ${practice.name}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const tp = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  topBar: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8, alignItems: 'flex-end' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center' },
  closeBtnLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  content: { paddingHorizontal: 24, paddingBottom: 48, gap: 14 },
  practiceHeader: { alignItems: 'center', gap: 8, marginBottom: 4 },
  emoji: { fontSize: 44 },
  name: { fontSize: 26, fontWeight: '800', color: '#111', textAlign: 'center' },
  sanskrit: { fontSize: 13, color: '#888', textAlign: 'center' },
  accentLine: { height: 1.5, width: 60, borderRadius: 1 },
  desc: { fontSize: 15, color: '#444', lineHeight: 24, textAlign: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  durRow: { flexDirection: 'row', gap: 6 },
  durChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  durMins: { fontSize: 16, fontWeight: '800' },
  durLabel: { fontSize: 9, fontWeight: '600', marginTop: 0 },
  bowlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEE' },
  bowlTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  // bowlSub no longer used
  bowlSub: { fontSize: 12, color: '#888' },
  toggle: { width: 40, height: 24, borderRadius: 12, padding: 3, justifyContent: 'center' },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumLabel: { fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 22 },
  mantraBox: { borderRadius: 14, padding: 16, borderWidth: 1, alignItems: 'center', gap: 6 },
  mantraText: { fontSize: 24, fontFamily: 'serif', fontWeight: '300', letterSpacing: 2 },
  mantraRoman: { fontSize: 12, color: '#888', fontStyle: 'italic', textAlign: 'center' },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  benefitDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  benefitText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 22 },
  startBtn: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  modeCard: { flex: 1, borderWidth: 1.5, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', gap: 4 },
  modeTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  modeSub: { fontSize: 10.5, color: '#AAA', textAlign: 'center' },
  startLabel: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
});

// ─── Practice Card ────────────────────────────────────────────────
function OrbCard({ practice, onPress }: { practice: MeditationType; onPress: () => void }) {
  const color = practice.orbColor;
  // Short subtitle — japa count or the practice's essence
  const sub = practice.hasJapa
    ? `${practice.japaCount ?? 108} japa · ${practice.sanskrit.split('(')[0].trim()}`
    : practice.sanskrit.split('(')[0].trim();
  return (
    <TouchableOpacity style={oc.row} onPress={onPress} activeOpacity={0.8}>
      <View style={oc.orbWrap}>
        <View style={[oc.glowRing, { borderColor: color + '28' }]} />
        <View style={[oc.orb, { backgroundColor: color + '14', borderColor: color + '38' }]}>
          <Text style={{ fontSize: 23 }}>{practice.emoji}</Text>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={oc.name} numberOfLines={1}>{practice.name}</Text>
        <Text style={[oc.sub, practice.hasJapa && { color: color }]} numberOfLines={1}>{sub}</Text>
      </View>
      <Text style={{ color: '#D4D4D4', fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

const oc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 0.5, borderColor: '#ECE7DC', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  orbWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glowRing: { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 1.5 },
  orb: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 11, color: '#A39C8E', marginTop: 2 },
});

// Legacy card kept for reference (unused)
function PracticeCard({ practice, onPress }: { practice: MeditationType; onPress: () => void }) {
  const DIFF = { beginner: '#34C759', intermediate: '#FF9500', advanced: '#FF3B30' };
  const color = practice.orbColor;
  return (
    <TouchableOpacity style={[pc.card]} onPress={onPress} activeOpacity={0.85}>
      <View style={[pc.left, { backgroundColor: color + '12' }]}>
        <Text style={{ fontSize: 26 }}>{practice.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={pc.name}>{practice.name}</Text>
        <Text style={pc.sub} numberOfLines={1}>{practice.sanskrit}</Text>
      </View>
      <Text style={{ color: '#DDD', fontSize: 22, lineHeight: 22 }}>›</Text>
    </TouchableOpacity>
  );
}

const pc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  left: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name: { fontSize: 15, fontWeight: '700', color: '#111' },
  sub: { fontSize: 11, color: '#AAA', marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '600' },
  dur: { fontSize: 18, fontWeight: '800' },
});

// ─── Main Screen ──────────────────────────────────────────────────
export default function MeditationScreen() {
  const { meditationSessions, addMeditationSession } = useAppStore();
  const [selected, setSelected] = useState<MeditationType | null>(null);
  const [active, setActive] = useState<{ practice: MeditationType; secs: number; bowl: boolean; stopwatch: boolean } | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filters = ['all', 'beginner', 'intermediate', 'advanced'];
  const shown = filter === 'all' ? MEDITATION_TYPES : MEDITATION_TYPES.filter(m => m.difficulty === filter);
  const totalMins = Math.round(meditationSessions.filter(s => s.isCompleted).reduce((a, s) => a + s.duration, 0) / 60);
  const totalSessions = meditationSessions.filter(s => s.isCompleted).length;

  function handleEnd(secs: number) {
    if (active && secs >= 10) {
      addMeditationSession(secs, true, active.practice.id);
    }
    setActive(null);
    setSelected(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <TabHeader accentColor={ACCENT} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {[
            { v: `${totalSessions}`, l: 'Sessions' },
            { v: `${totalMins}m`, l: 'Total Time' },
            { v: `${meditationSessions.filter(s => s.isCompleted && new Date(s.date).toDateString() === new Date().toDateString()).length}`, l: 'Today' },
          ].map(s => (
            <View key={s.l} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: ACCENT }}>{s.v}</Text>
              <Text style={{ fontSize: 10, color: '#888', fontWeight: '600' }}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {filters.map(f => {
            const active = filter === f;
            return (
              <TouchableOpacity key={f}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? ACCENT : '#fff', borderWidth: 1, borderColor: active ? ACCENT : '#EEE' }}
                onPress={() => setFilter(f)}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#888' }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>Dhyana Practices</Text>
          <Text style={{ fontSize: 13, color: '#AAA' }}>Mind · Consciousness · Spirit</Text>
        </View>

        {/* SACRED CHANTS — practices with real chant audio */}
        {(() => {
          const chants = shown.filter(m => MANTRA_AUDIO[m.id]);
          const silent = shown.filter(m => !MANTRA_AUDIO[m.id]);
          return (
            <>
              {chants.length > 0 && (
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontFamily: 'serif', fontSize: 16, color: '#D4A843' }}>ॐ</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>Sacred Chants</Text>
                    <View style={{ backgroundColor: '#F0ECE2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, color: '#9A8A70', fontWeight: '600' }}>{chants.length}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 14, color: '#C9A84A' }}>♪</Text>
                  </View>
                  <View style={{ gap: 9 }}>
                    {chants.map(m => <OrbCard key={m.id} practice={m} onPress={() => setSelected(m)} />)}
                  </View>
                </View>
              )}

              {silent.length > 0 && (
                <View style={{ gap: 10, marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15 }}>🌬️</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>Silent Practices</Text>
                    <View style={{ backgroundColor: '#F0ECE2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, color: '#9A8A70', fontWeight: '600' }}>breath &amp; awareness</Text>
                    </View>
                  </View>
                  <View style={{ gap: 9 }}>
                    {silent.map(m => <OrbCard key={m.id} practice={m} onPress={() => setSelected(m)} />)}
                  </View>
                </View>
              )}
            </>
          );
        })()}

        {/* History */}
        {totalSessions > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111', marginTop: 8 }}>History</Text>
            {meditationSessions.filter(s => s.isCompleted).slice(0, 6).map(s => {
              const p = MEDITATION_TYPES.find(m => m.id === s.meditationTypeId);
              return (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F0F0F0' }}>
                  <Text style={{ fontSize: 22 }}>{p?.emoji ?? '🕉'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111' }}>{p?.name ?? 'Meditation'}</Text>
                    <Text style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {Math.round(s.duration / 60)} min
                    </Text>
                  </View>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: (p?.orbColor ?? ACCENT) + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: p?.orbColor ?? ACCENT, fontSize: 14, fontWeight: '700' }}>✓</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Timer picker sheet */}
      {selected && !active && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
          <TimerPicker practice={selected} onClose={() => setSelected(null)} onStart={(secs, bowl, stopwatch) => setActive({ practice: selected, secs, bowl, stopwatch: !!stopwatch })} />
        </Modal>
      )}

      {/* Active session fullscreen */}
      {active && (
        <Modal visible animationType="slide" presentationStyle="fullScreen">
          <ActiveSession practice={active.practice} totalSecs={active.secs} bowlEnabled={active.bowl} stopwatch={active.stopwatch} onEnd={handleEnd} />
        </Modal>
      )}
    </View>
  );
}
