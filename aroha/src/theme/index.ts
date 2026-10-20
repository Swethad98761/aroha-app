// src/theme/index.ts
// Mirrors Swift AppTheme and AppLayout

import { StyleSheet } from 'react-native';

export type ThemeKey = 'workouts' | 'yoga' | 'meditation' | 'focus';

export const AppTheme = {
  workouts: {
    accentColor: '#FF3B30', // red
    label: 'Workouts',
  },
  yoga: {
    accentColor: '#AF52DE', // purple
    label: 'Yoga',
  },
  meditation: {
    accentColor: '#007AFF', // blue
    label: 'Meditation',
  },
  focus: {
    accentColor: '#FF3B30',
    label: 'Focus',
  },
} as const;

export const AppLayout = {
  screenMargin: 16,
  sectionSpacing: 16,
  rowSpacing: 10,
  cornerRadius: 14,
  cardPadding: 16,
};

export const Colors = {
  background: '#F2F2F7',        // systemGroupedBackground
  cardBackground: '#FFFFFF',    // secondarySystemBackground elevated
  secondaryBackground: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#6E6E73',
  tertiaryLabel: '#AEAEB2',
  separator: '#C6C6C8',
  green: '#34C759',
  blue: '#007AFF',
  red: '#FF3B30',
  purple: '#AF52DE',
  orange: '#FF9500',
};

export const cardStyle = {
  backgroundColor: Colors.cardBackground,
  borderRadius: AppLayout.cornerRadius,
  padding: AppLayout.cardPadding,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
  marginBottom: 0,
};
