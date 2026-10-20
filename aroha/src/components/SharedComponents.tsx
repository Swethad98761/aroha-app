// src/components/SharedComponents.tsx

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ViewStyle, TextStyle,
} from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { AppLayout, Colors, cardStyle } from '../theme';

// ─── Card ──────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[cardStyle, style]}>{children}</View>;
}

// ─── Section Title ─────────────────────────────────────────────────
export function SectionTitle({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

// ─── TechLogoHeader (matches Swift TechLogoHeader) ─────────────────
export function TechLogoHeader({ title, accentColor }: { title: string; accentColor: string }) {
  return (
    <View style={[styles.logoHeader, { borderBottomColor: accentColor + '30' }]}>
      <Text style={styles.logoHindi}>आरोह</Text>
      <View style={[styles.logoAccentBar, { backgroundColor: accentColor }]} />
      <Text style={[styles.logoSubtitle, { color: accentColor }]}>{title.toUpperCase()}</Text>
    </View>
  );
}

// ─── CircularProgressRing (matches Swift CircularProgressRing) ──────
interface RingProps {
  progress: number;        // 0–1
  targetMinutes: number;
  currentSeconds: number;
  accentColor: string;
  size?: number;
}

export function CircularProgressRing({ progress, targetMinutes, currentSeconds, accentColor, size = 72 }: RingProps) {
  const animRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animRef, {
      toValue: Math.min(progress, 1),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const clampedProg = Math.min(progress, 1);
  const dashOffset = circumference * (1 - clampedProg);

  const minutesDone = Math.floor(currentSeconds / 60);
  const label = progress >= 1 ? '✓' : `${minutesDone}m`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={Colors.secondaryBackground}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={progress >= 1 ? Colors.green : accentColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringLabel, { color: progress >= 1 ? Colors.green : accentColor, fontSize: progress >= 1 ? 18 : 11 }]}>
          {label}
        </Text>
        {progress < 1 && (
          <Text style={styles.ringGoal}>{targetMinutes}m</Text>
        )}
      </View>
    </View>
  );
}

// ─── WeeklyFractionRing ────────────────────────────────────────────
interface FractionRingProps {
  activeDays: number;
  goalDays: number;
  accentColor: string;
  size?: number;
}

export function WeeklyFractionRing({ activeDays, goalDays, accentColor, size = 38 }: FractionRingProps) {
  const progress = goalDays > 0 ? activeDays / goalDays : 0;
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.secondaryBackground} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={progress >= 1 ? Colors.green : accentColor}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={{ fontSize: 9, fontWeight: '800', color: progress >= 1 ? Colors.green : accentColor }}>
          {activeDays}/{goalDays}
        </Text>
      </View>
    </View>
  );
}

// ─── WeekDayDots ───────────────────────────────────────────────────
interface WeekDayDotsProps {
  weekDays: Date[];
  activeDays: Date[];
  accentColor: string;
}

export function WeekDayDots({ weekDays, activeDays, accentColor }: WeekDayDotsProps) {
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.weekDots}>
      {weekDays.map((day, idx) => {
        const active = activeDays.some(
          (ad) => ad.toDateString() === day.toDateString()
        );
        return (
          <View
            key={idx}
            style={[
              styles.weekDot,
              { backgroundColor: active ? accentColor : 'transparent', borderColor: active ? accentColor : Colors.separator },
            ]}
          >
            <Text style={[styles.weekDotLabel, { color: active ? '#fff' : Colors.secondaryLabel }]}>
              {dayLetters[idx]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── PrimaryButton ─────────────────────────────────────────────────
export function PrimaryButton({ label, onPress, color, icon }: { label: string; onPress: () => void; color: string; icon?: string }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: color, shadowColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon && <Text style={styles.primaryBtnIcon}>{icon}</Text>}
      <Text style={styles.primaryBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Divider ───────────────────────────────────────────────────────
export function HDivider() {
  return <View style={styles.hdivider} />;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.label,
    marginBottom: 8,
  },
  logoHeader: {
    paddingHorizontal: AppLayout.screenMargin,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
    marginBottom: AppLayout.sectionSpacing,
  },
  logoHindi: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.label,
    letterSpacing: 2,
  },
  logoAccentBar: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    fontWeight: '800',
    lineHeight: 14,
  },
  ringGoal: {
    fontSize: 8,
    color: Colors.secondaryLabel,
    fontWeight: '600',
  },
  weekDots: {
    flexDirection: 'row',
    gap: 4,
  },
  weekDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.secondaryLabel,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.tertiaryLabel,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: AppLayout.cornerRadius,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnIcon: {
    fontSize: 18,
  },
  primaryBtnLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hdivider: {
    height: 1,
    backgroundColor: Colors.separator,
    marginVertical: 8,
  },
});
