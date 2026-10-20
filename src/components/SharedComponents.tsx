import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Modal, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppLayout, Colors, cardStyle } from '../theme';
import { MoodLogo } from './MoodLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileScreen from '../screens/profile/ProfileScreen';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[cardStyle, style]}>{children}</View>;
}

export function SectionTitle({ children, style, color }: { children: string; style?: TextStyle; color?: string }) {
  return <Text style={[styles.sectionTitle, { color: color ?? Colors.label }, style]}>{children}</Text>;
}

export function TabHeader({ accentColor }: { accentColor: string }) {
  const insets = useSafeAreaInsets();
  const [showProfile, setShowProfile] = useState(false);

  function openProfile() {
    setShowProfile(true);
  }

  function closeProfile() {
    setShowProfile(false);
  }

  // Tab header logo ALWAYS stays accent color
  const logoColor = accentColor;

  return (
    <>
      <View style={[styles.tabHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={openProfile}
          activeOpacity={0.75}
        >
          <MoodLogo color={logoColor} size="sm" variant="red" />
        </TouchableOpacity>
        <View style={[styles.accentLine, { backgroundColor: accentColor + '30' }]} />
      </View>

      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeProfile}
        
      >
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
          {/* Drag handle */}
          <View style={styles.modalHandle} />
          {/* Header row: black logo + line + close */}
          <View style={styles.profileModalHeader}>
            <MoodLogo color="#0A0A0A" size="sm" variant="red" />
            <View style={styles.profileModalLine} />
            <TouchableOpacity style={styles.closeBtn} onPress={closeProfile}>
              <Text style={styles.closeBtnLabel}>✕</Text>
            </TouchableOpacity>
          </View>
          <ProfileScreen />
        </View>
      </Modal>
    </>
  );
}

export function CircularProgressRing({ progress, targetMinutes, currentSeconds, accentColor, size = 72 }: {
  progress: number; targetMinutes: number; currentSeconds: number; accentColor: string; size?: number;
}) {
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(progress, 1));
  const minutesDone = Math.floor(currentSeconds / 60);
  const label = progress >= 1 ? '✓' : `${minutesDone}m`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={Colors.separator} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={cx} cy={cy} r={r}
          stroke={progress >= 1 ? Colors.green : accentColor}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round" rotation="-90" origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringLabel, { color: progress >= 1 ? Colors.green : accentColor, fontSize: progress >= 1 ? 18 : 11 }]}>{label}</Text>
        {progress < 1 && <Text style={styles.ringGoal}>{targetMinutes}m</Text>}
      </View>
    </View>
  );
}

export function WeeklyFractionRing({ activeDays, goalDays, accentColor, size = 38 }: { activeDays: number; goalDays: number; accentColor: string; size?: number }) {
  const progress = goalDays > 0 ? activeDays / goalDays : 0;
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(progress, 1));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={Colors.separator} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size/2} cy={size/2} r={r}
          stroke={progress >= 1 ? Colors.green : accentColor}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round" rotation="-90" origin={`${size/2}, ${size/2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={{ fontSize: 9, fontWeight: '800', color: progress >= 1 ? Colors.green : accentColor }}>{activeDays}/{goalDays}</Text>
      </View>
    </View>
  );
}

export function WeekDayDots({ weekDays, activeDays, accentColor }: { weekDays: Date[]; activeDays: Date[]; accentColor: string }) {
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={styles.weekDots}>
      {weekDays.map((day, idx) => {
        const active = activeDays.some((ad) => ad.toDateString() === day.toDateString());
        return (
          <View key={idx} style={[styles.weekDot, { backgroundColor: active ? accentColor : 'transparent', borderColor: active ? accentColor : Colors.separator }]}>
            <Text style={[styles.weekDotLabel, { color: active ? '#fff' : Colors.secondaryLabel }]}>{dayLetters[idx]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function PrimaryButton({ label, onPress, color, icon }: { label: string; onPress: () => void; color: string; icon?: string }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: color, shadowColor: color }]} onPress={onPress} activeOpacity={0.85}>
      {icon && <Text style={styles.primaryBtnIcon}>{icon}</Text>}
      <Text style={styles.primaryBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function HDivider() {
  return <View style={styles.hdivider} />;
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  tabHeader: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: AppLayout.screenMargin,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accentLine: { flex: 1, height: 1, borderRadius: 1 },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginTop: 12,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnLabel: { fontSize: 13, color: '#555', fontWeight: '700' },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { fontWeight: '800', lineHeight: 14 },
  ringGoal: { fontSize: 8, color: Colors.secondaryLabel, fontWeight: '600' },
  weekDots: { flexDirection: 'row', gap: 4 },
  weekDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekDotLabel: { fontSize: 9, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.secondaryLabel, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: Colors.tertiaryLabel, textAlign: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: AppLayout.cornerRadius, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  primaryBtnIcon: { fontSize: 18 },
  primaryBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hdivider: { height: 1, backgroundColor: Colors.separator, marginVertical: 8 },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppLayout.screenMargin,
    paddingBottom: 10,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  profileModalLine: { flex: 1, height: 1, backgroundColor: '#0A0A0A20', borderRadius: 1 },
});
