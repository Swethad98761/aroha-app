// src/screens/auth/LoginScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, Modal, Animated, Image, Easing,
} from 'react-native';
import { useAuth } from '../../store/AuthStore';
import { MoodLogo } from '../../components/MoodLogo';
import { supabase } from '../../lib/supabase';

const GRAD_COLORS = ['#FF5500', '#DA70D6', '#D4A843'];

// Coin that breathes (gentle scale + glow pulse) — used on the intro splash
function BreathingCoin({ large }: { large?: boolean }) {
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] });
  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const dim = large ? 300 : 230;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: dim + 60, height: dim + 60 }}>
      <Animated.View style={[styles.whiteGlow, { opacity: glowOpacity, width: dim + 40, height: dim + 40, borderRadius: (dim + 40) / 2 }]} />
      <GlowingRings />
      <Animated.Image source={require('../../../assets/logo.png')} style={{ width: dim, height: dim, transform: [{ scale }] }} resizeMode="contain" />
    </View>
  );
}

// Animated white glowing rings that pulse outward behind the coin
function GlowingRings() {
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = rings.map((v, i) =>
      Animated.loop(
        Animated.timing(v, { toValue: 1, duration: 6000, delay: i * 2000, easing: Easing.out(Easing.ease), useNativeDriver: true })
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);
  return (
    <View style={styles.ringsWrap} pointerEvents="none">
      {rings.map((v, i) => {
        const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] });
        const opacity = v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.3, 0] });
        return (
          <Animated.View key={i} style={[styles.ring, { opacity, transform: [{ scale }] }]} />
        );
      })}
    </View>
  );
}

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showSplash, setShowSplash] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) { Alert.alert('Please fill in all fields'); return; }
    if (mode === 'signup' && password !== confirm) { Alert.alert('Passwords do not match'); return; }
    if (mode === 'signup' && password.length < 6) { Alert.alert('Password must be at least 6 characters'); return; }
    setLoading(true);
    const err = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    setLoading(false);
    if (err) { Alert.alert('Error', err); return; }
    if (mode === 'signup') setSignupDone(true);
  }

  async function handleReset() {
    if (!resetEmail.trim()) { Alert.alert('Enter your email'); return; }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    setResetLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setResetSent(true);
  }

  if (signupDone) {
    return (
      <View style={styles.centerScreen}>
        <MoodLogo color="#FF5500" size="lg" />
        <View style={styles.gradLine} />
        <Text style={styles.centerTitle}>Check your inbox 📬</Text>
        <Text style={styles.centerSub}>
          Verification link sent to{'\n'}
          <Text style={{ color: '#FF5500', fontWeight: '700' }}>{email}</Text>
          {'\n\n'}Click the link then sign in.
        </Text>
        <TouchableOpacity style={styles.gradBtn} onPress={() => { setMode('login'); setSignupDone(false); }} activeOpacity={0.85}>
          <Text style={styles.gradBtnLabel}>Back to Sign In →</Text>
        </TouchableOpacity>
        <Text style={styles.tagline}>Ancient wisdom · Modern practice</Text>
      </View>
    );
  }

  // Intro splash — tap the glowing coin to enter
  if (showSplash) {
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.splash} onPress={() => setShowSplash(false)}>
        <BreathingCoin large />
        <View style={[styles.taglineRow, { marginTop: 40 }]}>
          <View style={styles.taglineDash} />
          <Text style={styles.tagline}>Ancient wisdom · Modern practice</Text>
          <View style={styles.taglineDash} />
        </View>
        <Text style={styles.splashHint}>Tap to begin</Text>
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFFFF' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Centered coin watermark — fills behind everything, faint */}
      <View style={styles.watermarkLayer} pointerEvents="none">
        <View style={styles.watermarkGlow} />
        <Image source={require('../../../assets/logo.png')} style={styles.watermarkCoin} resizeMode="contain" />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Sliding underline tabs */}
        <View style={styles.underlineTabs}>
          <TouchableOpacity style={styles.underlineTab} onPress={() => setMode('login')} activeOpacity={0.7}>
            <Text style={[styles.underlineLabel, mode === 'login' && styles.underlineLabelActive]}>Sign in</Text>
            <View style={[styles.underlineBar, mode === 'login' ? styles.underlineBarActive : styles.underlineBarHidden]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.underlineTab} onPress={() => setMode('signup')} activeOpacity={0.7}>
            <Text style={[styles.underlineLabel, mode === 'signup' && styles.underlineLabelActive]}>Create account</Text>
            <View style={[styles.underlineBar, mode === 'signup' ? styles.underlineBarActive : styles.underlineBarHidden]} />
          </TouchableOpacity>
        </View>

        {/* Inputs with labels */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <View style={styles.inputLine}>
            <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor="#CCC" />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <View style={styles.inputLine}>
            <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#CCC" />
            {mode === 'login' && (
              <TouchableOpacity onPress={() => { setResetEmail(email); setShowReset(true); }}>
                <Text style={styles.forgotInline}>Forgot?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {mode === 'signup' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputLine}>
              <TextInput style={styles.input} placeholder="••••••••" value={confirm} onChangeText={setConfirm} secureTextEntry placeholderTextColor="#CCC" />
            </View>
          </View>
        )}

        {/* Gold glowing-ring CTA */}
        <TouchableOpacity style={styles.goldBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#9A7B3A" /> : <Text style={styles.goldBtnLabel}>{mode === 'login' ? 'Begin Your Practice' : 'Create Account'}</Text>}
        </TouchableOpacity>

        <Text style={styles.bottomHint}>
          {mode === 'login' ? 'New to Aroha? ' : 'Already practicing? '}
          <Text style={styles.bottomHintLink} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Create your account' : 'Sign in'}
          </Text>
        </Text>
      </ScrollView>

      {/* Reset Password Modal */}
      <Modal visible={showReset} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setShowReset(false); setResetSent(false); }}>
        <View style={styles.resetContainer}>
          <View style={styles.resetHeader}>
            <TouchableOpacity onPress={() => { setShowReset(false); setResetSent(false); }}>
              <Text style={{ color: '#007AFF', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.resetBody}>
            <View style={styles.brandRow}>
              <MoodLogo color="#FF5500" size="sm" />
              <Text style={styles.wordmark}>AROHA</Text>
            </View>
            <View style={styles.gradLine} />
            {resetSent ? (
              <View style={{ alignItems: 'center', gap: 12, marginTop: 24 }}>
                <Text style={{ fontSize: 48 }}>📬</Text>
                <Text style={styles.centerTitle}>Check your inbox</Text>
                <Text style={styles.centerSub}>Reset link sent to{'\n'}<Text style={{ color: '#FF5500', fontWeight: '700' }}>{resetEmail}</Text></Text>
                <TouchableOpacity style={styles.gradBtn} onPress={() => { setShowReset(false); setResetSent(false); }}>
                  <Text style={styles.gradBtnLabel}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <Text style={styles.resetTitle}>Reset Password</Text>
                <Text style={styles.resetSub}>Enter your email and we'll send a reset link.</Text>
                <View style={styles.inputLine}>
                  <TextInput style={styles.input} placeholder="Email address" value={resetEmail} onChangeText={setResetEmail} keyboardType="email-address" autoCapitalize="none" autoFocus placeholderTextColor="#CCC" />
                </View>
                <TouchableOpacity style={styles.gradBtn} onPress={handleReset} disabled={resetLoading} activeOpacity={0.85}>
                  {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.gradBtnLabel}>Send Reset Link</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => { setShowReset(false); setResetSent(false); }}>
                  <Text style={styles.ghostBtnLabel}>← Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 28, paddingTop: 90, paddingBottom: 32, justifyContent: 'center' },

  // Centered coin watermark (login background)
  watermarkLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  watermarkGlow: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 60,
  },
  watermarkCoin: { width: 300, height: 300, opacity: 0.10 },

  // Intro splash
  splash: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 32 },
  splashHint: { fontSize: 12, color: '#C5C5C5', letterSpacing: 2, marginTop: 48, textTransform: 'uppercase' },

  // Hero coin — centered, large, glowing
  heroWrap: { alignItems: 'center', justifyContent: 'center', height: 240, marginBottom: 24 },
  whiteGlow: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 50, elevation: 0,
  },
  ringsWrap: { position: 'absolute', width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
  },
  heroLogo: { width: 230, height: 230, opacity: 1 },

  // Tagline (bottom)
  taglineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 32 },
  tagline: { fontSize: 11, color: '#B5B5B5', letterSpacing: 1.2, fontStyle: 'italic' },
  taglineDash: { width: 18, height: 1, backgroundColor: '#DDD' },

  // Sliding underline tabs
  underlineTabs: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 30 },
  underlineTab: { alignItems: 'center' },
  underlineLabel: { fontSize: 15, fontWeight: '600', color: '#BBB', paddingBottom: 7 },
  underlineLabelActive: { color: '#111' },
  underlineBar: { height: 2.5, width: '100%', borderRadius: 2 },
  underlineBarActive: { backgroundColor: '#999' },
  underlineBarHidden: { backgroundColor: 'transparent' },

  // Fields
  fieldGroup: { marginBottom: 22 },
  fieldLabel: { fontSize: 11, color: '#B0B0B0', letterSpacing: 0.5, marginBottom: 6, fontWeight: '600' },
  inputLine: { borderBottomWidth: 1.5, borderBottomColor: '#ECECEC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { fontSize: 16, color: '#111', paddingBottom: 9, paddingTop: 2, flex: 1 },
  forgotInline: { fontSize: 12, color: '#C8B89A', paddingLeft: 10 },

  // Silver glowing-ring CTA (matches the coin)
  goldBtn: {
    borderRadius: 40, paddingVertical: 16, alignItems: 'center', marginTop: 14, marginBottom: 22,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D8D8D8',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 16, elevation: 4,
  },
  goldBtnLabel: { color: '#444', fontWeight: '800', fontSize: 15, letterSpacing: 1 },

  bottomHint: { fontSize: 12.5, color: '#AAA', textAlign: 'center', marginTop: 4 },
  bottomHintLink: { color: '#333', fontWeight: '700' },

  // Signup success + reset (kept)
  centerScreen: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  centerTitle: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center' },
  centerSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  gradLine: { height: 1.5, backgroundColor: '#C9A24B', borderRadius: 1, marginBottom: 24, width: 80, alignSelf: 'center' },
  gradBtn: {
    borderRadius: 40, padding: 15, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9A24B',
    shadowColor: '#C9A24B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 4,
  },
  gradBtnLabel: { color: '#9A7B3A', fontWeight: '800', fontSize: 16 },
  ghostBtn: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 40, padding: 14, alignItems: 'center', marginTop: 12 },
  ghostBtnLabel: { color: '#888', fontWeight: '700', fontSize: 15 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, justifyContent: 'center' },
  resetContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  resetHeader: { padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  resetBody: { padding: 28, paddingTop: 32 },
  resetTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  resetSub: { fontSize: 14, color: '#888', lineHeight: 22 },
  forgot: { fontSize: 13, color: '#BBB' },
});
