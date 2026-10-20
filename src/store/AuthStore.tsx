// src/store/AuthStore.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userId: string | null;
  email: string | null;
  username: string | null;
  emailVerified: boolean;
  isLoading: boolean;
  onboardingDone: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  setUsername: (name: string) => Promise<void>;
  setOnboardingDone: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);

  useEffect(() => {
    refreshSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email ?? null);
        setEmailVerified(!!session.user.email_confirmed_at);
      } else {
        setUserId(null);
        setEmail(null);
        setEmailVerified(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function refreshSession() {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email ?? null);
        setEmailVerified(!!session.user.email_confirmed_at);
        const stored = await AsyncStorage.getItem(`username_${session.user.id}`);
        setUsernameState(stored);
        const ob = await AsyncStorage.getItem(`onboarding_${session.user.id}`);
        setOnboardingDoneState(ob === 'true');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    if (data.user) {
      setEmailVerified(!!data.user.email_confirmed_at);
      const stored = await AsyncStorage.getItem(`username_${data.user.id}`);
      setUsernameState(stored);
      const ob = await AsyncStorage.getItem(`onboarding_${data.user.id}`);
      setOnboardingDoneState(ob === 'true');
    }
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserId(null); setEmail(null); setUsernameState(null);
    setEmailVerified(false); setOnboardingDoneState(false);
  }

  async function setUsername(name: string) {
    if (!userId) return;
    await AsyncStorage.setItem(`username_${userId}`, name);
    setUsernameState(name);
  }

  async function setOnboardingDone() {
    if (!userId) return;
    await AsyncStorage.setItem(`onboarding_${userId}`, 'true');
    setOnboardingDoneState(true);
  }

  return (
    <AuthContext.Provider value={{
      userId, email, username, emailVerified, isLoading, onboardingDone,
      signUp, signIn, signOut, setUsername, setOnboardingDone, refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthStoreProvider');
  return ctx;
}
