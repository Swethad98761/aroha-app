import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

type Screen = 'intro' | 'login';
type Tab = 'signin' | 'create';

export default function LoginScreen() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Intro animations
  const coinScale = useRef(new Animated.Value(0.85)).current;
  const coinOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring3Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const tapOpacity = useRef(new Animated.Value(0)).current;
  const tapPulse = useRef(new Animated.Value(1)).current;

  // Form animations
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const tabIndicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance: coin fades + scales in
    Animated.parallel([
      Animated.timing(coinOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(coinScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start(() => {
      // Glow fades in
      Animated.timing(glowOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      // Rings pulse outward
      startRings();
      // Tagline
      setTimeout(() => {
        Animated.timing(taglineOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      }, 400);
      // TAP TO BEGIN
      setTimeout(() => {
        Animated.timing(tapOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
          startTapPulse();
        });
      }, 900);
    });
  }, []);

  const startRings = () => {
    const ringAnim = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      const loop = () => {
        scale.setValue(1);
        opacity.setValue(0.5);
        Animated.parallel([
          Animated.timing(scale, { toValue: 2.2, duration: 2800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2800, useNativeDriver: true }),
        ]).start(() => setTimeout(loop, 400));
      };
      setTimeout(loop, delay);
    };
    ringAnim(ring1Scale, ring1Opacity, 0);
    ringAnim(ring2Scale, ring2Opacity, 900);
    ringAnim(ring3Scale, ring3Opacity, 1800);
  };

  const startTapPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(tapPulse, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(tapPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleTap = () => {
    Animated.parallel([
      Animated.timing(coinOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(tapOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setScreen('login');
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(formTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    });
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError('');
    Animated.spring(tabIndicatorX, {
      toValue: t === 'signin' ? 0 : 1,
      friction: 7,
      tension: 50,
      useNativeDriver: false,
    }).start();
  };

  const handleAuth = async () => {
    setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }
    if (tab === 'create' && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      if (tab === 'signin') {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) setError(e.message);
      } else {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) setError(e.message);
        else setError('Check your email to confirm your account.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const COIN_SIZE = 300;
  const tabWidth = (width - 64) / 2;

  if (screen === 'intro') {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        style={styles.introContainer}
      >
        <StatusBar barStyle="light-content" />

        {/* Pulsing rings */}
        {[ring1Scale, ring2Scale, ring3Scale].map((s, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              {
                width: COIN_SIZE,
                height: COIN_SIZE,
                borderRadius: COIN_SIZE / 2,
                transform: [{ scale: s }],
                opacity: [ring1Opacity, ring2Opacity, ring3Opacity][i],
              },
            ]}
          />
        ))}

        {/* White glow behind coin */}
        <Animated.View
          style={[
            styles.coinGlow,
            {
              width: COIN_SIZE + 60,
              height: COIN_SIZE + 60,
              borderRadius: (COIN_SIZE + 60) / 2,
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Coin */}
        <Animated.View
          style={{
            opacity: coinOpacity,
            transform: [{ scale: coinScale }],
            width: COIN_SIZE,
            height: COIN_SIZE,
            borderRadius: COIN_SIZE / 2,
            overflow: 'hidden',
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 30,
            elevation: 20,
          }}
        >
          <Image
            source={require('../../../assets/logo.png')}
            style={{ width: COIN_SIZE, height: COIN_SIZE, borderRadius: COIN_SIZE / 2 }}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Ancient wisdom · Modern practice
        </Animated.Text>

        {/* TAP TO BEGIN */}
        <Animated.Text style={[styles.tapText, { opacity: Animated.multiply(tapOpacity, tapPulse) }]}>
          TAP TO BEGIN
        </Animated.Text>
      </TouchableOpacity>
    );
  }

  // LOGIN FORM
  return (
    <KeyboardAvoidingView
      style={styles.formContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={{
            flex: 1,
            opacity: formOpacity,
            transform: [{ translateY: formTranslateY }],
          }}
        >
          {/* Watermark coin centered behind form */}
          <View style={styles.watermarkContainer} pointerEvents="none">
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.watermark}
              resizeMode="contain"
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {(['signin', 'create'] as Tab[]).map((t) => (
              <TouchableOpacity key={t} onPress={() => switchTab(t)} style={styles.tabBtn}>
                <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                  {t === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Sliding underline */}
            <Animated.View
              style={[
                styles.tabUnderline,
                {
                  width: tabWidth,
                  left: tabIndicatorX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, tabWidth],
                  }),
                },
              ]}
            />
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#666666"
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666666"
              placeholder="••••••••"
            />
          </View>

          {tab === 'create' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#666666"
                placeholder="••••••••"
              />
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{loading ? '...' : 'Begin Your Practice'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── INTRO ──────────────────────────────────────────────
  introContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  coinGlow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 0,
  },
  tagline: {
    marginTop: 40,
    color: '#cccccc',
    fontSize: 15,
    letterSpacing: 2,
    fontWeight: '300',
  },
  tapText: {
    position: 'absolute',
    bottom: 80,
    color: '#888888',
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '300',
  },

  // ── FORM ───────────────────────────────────────────────
  formContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
  },
  watermarkContainer: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  watermark: {
    width: 260,
    height: 260,
    opacity: 0.07,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 40,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  tabBtn: {
    flex: 1,
    paddingBottom: 14,
    alignItems: 'center',
  },
  tabLabel: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    backgroundColor: '#ffffff',
  },
  inputGroup: {
    marginBottom: 24,
    zIndex: 1,
  },
  inputLabel: {
    color: '#555555',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 2,
    fontWeight: '400',
  },
});
