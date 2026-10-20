// src/theme/index.ts
import { StyleSheet } from 'react-native';

export const MoodColors = {
  workouts: '#FF5500',   // Lava Amber
  yoga:     '#DA70D6',   // Orchid
  meditation: '#D4A843', // Antique Gold
  focus:    '#D4A843',   // Antique Gold
} as const;

export const AppTheme = {
  workouts:  { accentColor: '#FF5500', label: 'Vyayama',  bgTint: '#FFF8F5' },
  yoga:      { accentColor: '#DA70D6', label: 'Yoga',     bgTint: '#FDF5FF' },
  meditation: { accentColor: '#D4A843', label: 'Dhyana',   bgTint: '#FAFAFA' },
  focus:     { accentColor: '#D4A843', label: 'Prakriti', bgTint: '#FFFBF0' },
} as const;

export const AppLayout = {
  screenMargin: 16,
  sectionSpacing: 16,
  rowSpacing: 10,
  cornerRadius: 14,
  cardPadding: 16,
};

export const Colors = {
  background: '#FAFAFA',
  cardBackground: '#FFFFFF',
  secondaryBackground: '#F5F5F5',
  label: '#111111',
  secondaryLabel: '#888888',
  tertiaryLabel: '#BBBBBB',
  separator: '#EEEEEE',
  green: '#34C759',
  blue: '#007AFF',
  red: '#FF3B30',
  purple: '#DA70D6',
  orange: '#FF5500',
};

export const GRADIENT = ['#FF5500', '#DA70D6', '#D4A843'] as const;

export const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
  borderWidth: 1,
  borderColor: '#EEEEEE',
};
