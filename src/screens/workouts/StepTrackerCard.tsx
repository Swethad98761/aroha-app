// src/screens/workouts/StepTrackerCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform, Animated } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText, Image as SvgImage, G } from 'react-native-svg';
import { cardStyle, Colors } from '../../theme';
import { getTodaySteps, getStepHistory, getWeeklyStepTotal, StepEntry } from '../../db/stepTracker';
import { formatDateShort } from '../../utils';
import { useLiveSteps } from '../../hooks/useLiveSteps';
import { useCompassHeading } from '../../hooks/useCompassHeading';

const STEP_GOAL = 10000;
const NUMERAL_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const GOLD = '#B8860B';
const GOLD_SOFT = '#B8A278';
const BEZEL_TRACK = '#EDE3D0';
const ARC_TRACK = '#F5EFE2';
const ARC_COLOR = '#FF5500';
const EMERALD = '#0F6E56';
const RUBY = '#A32D2D';
const INK = '#1A1A1E';
const BRONZE = '#8A6B3E';

const AnimatedG = Animated.createAnimatedComponent(G);

// Precomputed dial geometry, local coordinate space centered at (270,270),
// bezel radius 180, progress ring radius 140. Matches the approved mockup.
const MINOR_TICKS: [number, number, number, number][] = [
  [270, 90, 270, 102.6],
  [338.9, 103.7, 333.6, 115.3],
  [397.3, 142.7, 388.4, 151.6],
  [436.3, 201.1, 424.7, 206.4],
  [436.3, 338.9, 424.7, 333.6],
  [397.3, 397.3, 388.4, 388.4],
  [338.9, 436.3, 333.6, 424.7],
  [201.1, 436.3, 206.4, 424.7],
  [142.7, 397.3, 151.6, 388.4],
  [103.7, 338.9, 115.3, 333.6],
  [103.7, 201.1, 115.3, 206.4],
  [142.7, 142.7, 151.6, 151.6],
  [201.1, 103.7, 206.4, 115.3],
];
// N and S stay minor ticks; E and W are the major (thicker) ticks.
const N_TICK: [number, number, number, number] = [270, 90, 270, 102.6];
const S_TICK: [number, number, number, number] = [270, 450, 270, 437.4];
const E_TICK: [number, number, number, number] = [450, 270, 428.4, 270];
const W_TICK: [number, number, number, number] = [90, 270, 111.6, 270];

const CIRCUMFERENCE = 2 * Math.PI * 140;

export function StepTrackerCard() {
  const [todayEntry, setTodayEntry] = useState<StepEntry | null>(null);
  const [history, setHistory] = useState<StepEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const weeklyTotal = getWeeklyStepTotal();

  function refresh() {
    setTodayEntry(getTodaySteps());
    setHistory(getStepHistory());
  }

  useEffect(() => {
    refresh();
  }, []);

  const { isAvailable, permissionGranted } = useLiveSteps(() => refresh());
  const { heading, available: compassAvailable } = useCompassHeading();

  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Rotate the bezel counter to the device heading so the N/S/E/W
    // markers land where true north/south/east/west actually are on
    // screen, matching the OS Compass app.
    rotateAnim.setValue(-heading);
  }, [heading]);

  const bezelTransform = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['rotate(0 270 270)', 'rotate(360 270 270)'],
  });

  const todaySteps = todayEntry?.steps ?? 0;
  const todayMiles = todayEntry?.miles ?? 0;
  const todayCalories = todayEntry?.calories ?? 0;
  const progress = Math.min(todaySteps / STEP_GOAL, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const isLive = isAvailable && permissionGranted;
  const statusLabel =
    isAvailable === null ? null
    : isAvailable === false ? 'Not supported on this device'
    : permissionGranted === false ? 'Motion access denied — enable in Settings'
    : Platform.OS === 'android' ? 'Live (while app open)'
    : 'Live';

  return (
    <>
      <View style={[cardStyle, styles.card]}>
        <View style={styles.header}>
          <Text style={styles.title}>DAILY STEPS</Text>
          <View style={styles.headerRight}>
            {isLive && (
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabel}>LIVE</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setShowHistory(true)}>
              <Text style={styles.histBtnLabel}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {statusLabel && !isLive && (
          <Text style={styles.statusText}>{statusLabel}</Text>
        )}

        <Svg viewBox="0 0 540 540" style={styles.dial}>
          <AnimatedG transform={compassAvailable ? bezelTransform : undefined}>
            <Circle cx={270} cy={270} r={180} fill="none" stroke={BEZEL_TRACK} strokeWidth={1.5} />
            {MINOR_TICKS.map(([x1, y1, x2, y2], i) => (
              <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD_SOFT} strokeWidth={2.5} />
            ))}
            <Line x1={N_TICK[0]} y1={N_TICK[1]} x2={N_TICK[2]} y2={N_TICK[3]} stroke={GOLD_SOFT} strokeWidth={2.5} />
            <Line x1={S_TICK[0]} y1={S_TICK[1]} x2={S_TICK[2]} y2={S_TICK[3]} stroke={GOLD_SOFT} strokeWidth={2.5} />
            <Line x1={E_TICK[0]} y1={E_TICK[1]} x2={E_TICK[2]} y2={E_TICK[3]} stroke={GOLD} strokeWidth={3.5} />
            <Line x1={W_TICK[0]} y1={W_TICK[1]} x2={W_TICK[2]} y2={W_TICK[3]} stroke={GOLD} strokeWidth={3.5} />

            <Path d="M 270 74 L 280 92 L 270 108 L 260 92 Z" fill={EMERALD} />
            <Path d="M 270 466 L 280 448 L 270 432 L 260 448 Z" fill={RUBY} />
            <Path d="M 466 270 L 448 280 L 432 270 L 448 260 Z" fill={GOLD} />
            <Path d="M 74 270 L 92 280 L 108 270 L 92 260 Z" fill={GOLD} />

            <SvgText x={270} y={54} textAnchor="middle" fontSize={18} fontWeight="600" fill={BRONZE}>N</SvgText>
            <SvgText x={270} y={504} textAnchor="middle" fontSize={18} fontWeight="600" fill={BRONZE}>S</SvgText>
            <SvgText x={494} y={278} textAnchor="middle" fontSize={18} fontWeight="600" fill={BRONZE}>E</SvgText>
            <SvgText x={46} y={278} textAnchor="middle" fontSize={18} fontWeight="600" fill={BRONZE}>W</SvgText>
          </AnimatedG>

          <SvgImage
            href={require('../../../assets/logo_watermark.png')}
            x={130} y={130} width={280} height={280} opacity={0.14}
          />

          <Circle cx={270} cy={270} r={140} fill="none" stroke={ARC_TRACK} strokeWidth={7} />
          <Circle
            cx={270} cy={270} r={140} fill="none" stroke={ARC_COLOR} strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 270 270)"
          />

          <SvgText x={270} y={280} textAnchor="middle" fontSize={54} fontFamily={NUMERAL_FONT} fill={INK}>
            {todaySteps.toLocaleString()}
          </SvgText>
          <SvgText x={270} y={312} textAnchor="middle" fontSize={20} fontWeight="600" fill={BRONZE}>
            {`OF ${STEP_GOAL.toLocaleString()}`}
          </SvgText>
        </Svg>

        <View style={styles.statRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{todayMiles}</Text>
            <Text style={styles.statLabel}>MILES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{todayCalories}</Text>
            <Text style={styles.statLabel}>KCAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{weeklyTotal >= 1000 ? `${Math.round(weeklyTotal / 1000)}k` : weeklyTotal}</Text>
            <Text style={styles.statLabel}>WEEK</Text>
          </View>
        </View>
      </View>

      <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowHistory(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>Step History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}><Text style={{ color: Colors.blue, fontSize: 16 }}>Done</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {history.length === 0
              ? <Text style={{ color: Colors.secondaryLabel, textAlign: 'center', marginTop: 40 }}>No steps recorded yet</Text>
              : history.map((e) => (
                <View key={e.id} style={styles.histRow}>
                  <View>
                    <Text style={styles.histDate}>{formatDateShort(e.date)}</Text>
                    <Text style={styles.histSub}>{e.miles} mi · {e.calories} kcal</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.histSteps, { color: e.steps >= STEP_GOAL ? Colors.green : ARC_COLOR }]}>
                      {e.steps.toLocaleString()}
                    </Text>
                    <Text style={styles.histGoal}>/ {STEP_GOAL.toLocaleString()} steps</Text>
                  </View>
                </View>
              ))
            }
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '700', color: BRONZE, letterSpacing: 1.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD },
  liveLabel: { fontSize: 11, fontWeight: '600', color: GOLD, letterSpacing: 1 },
  statusText: { fontSize: 12, color: Colors.tertiaryLabel, fontStyle: 'italic' },
  histBtnLabel: { fontSize: 12, fontWeight: '600', color: Colors.secondaryLabel },
  dial: { width: '100%', aspectRatio: 1 },
  statRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EDE3D0', paddingTop: 14 },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#EDE3D0' },
  statValue: { fontSize: 17, color: INK, fontFamily: NUMERAL_FONT },
  statLabel: { fontSize: 10, color: BRONZE, letterSpacing: 1, marginTop: 3, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#FAFAFA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.label },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.separator },
  histDate: { fontSize: 14, fontWeight: '700', color: Colors.label },
  histSub: { fontSize: 12, color: Colors.secondaryLabel, marginTop: 2 },
  histSteps: { fontSize: 18, fontWeight: '900' },
  histGoal: { fontSize: 10, color: Colors.tertiaryLabel },
});
