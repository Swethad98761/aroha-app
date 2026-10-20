// src/store/ThemeStore.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  bg: string;
  card: string;
  label: string;
  secondaryLabel: string;
  separator: string;
  inputBg: string;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('aroha_dark_mode').then((val) => {
      if (val !== null) setIsDark(val === 'true');
      else setIsDark(systemScheme === 'dark');
    });
  }, []);

  async function toggle() {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('aroha_dark_mode', String(next));
  }

  const value: ThemeState = {
    isDark,
    toggle,
    bg:              isDark ? '#0A0A0A' : '#FAFAFA',
    card:            isDark ? '#1A1A1A' : '#FFFFFF',
    label:           isDark ? '#FFFFFF' : '#111111',
    secondaryLabel:  isDark ? '#888888' : '#666666',
    separator:       isDark ? '#2A2A2A' : '#EEEEEE',
    inputBg:         isDark ? '#111111' : '#F5F5F5',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
