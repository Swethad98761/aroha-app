import { Tabs } from 'expo-router';
import { Platform, Animated, StyleSheet, Image } from 'react-native';
import { useEffect, useRef } from 'react';

function TrishulIcon({ focused }: { focused: boolean }) {
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (focused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, { toValue: 1.35, duration: 1400, useNativeDriver: true }),
          Animated.timing(breathe, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    } else { breathe.stopAnimation(); breathe.setValue(1); }
  }, [focused]);
  return (
    <Animated.View style={{ transform: [{ scale: breathe }], opacity: focused ? 1 : 0.3, marginTop: 6 }}>
      <Image
        source={focused ? require('../../assets/gada_red.png') : require('../../assets/gada_silver.png')}
        style={{ width: 34, height: 34 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function LotusIcon({ focused }: { focused: boolean }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (focused) {
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1.18, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])).start();
    } else { anim.stopAnimation(); anim.setValue(1); }
  }, [focused]);
  return <Animated.Text style={[s.icon, { transform: [{ scale: anim }], opacity: focused ? 1 : 0.3 }]}>🪷</Animated.Text>;
}

function OmIcon({ focused }: { focused: boolean }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (focused) {
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])).start();
    } else { anim.stopAnimation(); anim.setValue(1); }
  }, [focused]);
  return <Animated.Text style={[s.omIcon, { opacity: focused ? anim : 0.3, color: focused ? '#D4A843' : '#888' }]}>ॐ</Animated.Text>;
}

function MeruIcon({ focused }: { focused: boolean }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (focused) {
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.96, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])).start();
    } else { anim.stopAnimation(); anim.setValue(1); }
  }, [focused]);
  return <Animated.Text style={[s.icon, { transform: [{ scale: anim }], opacity: focused ? 1 : 0.3 }]}>🏔</Animated.Text>;
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopColor: '#EEEEEE',
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        paddingTop: 10,
        height: Platform.OS === 'ios' ? 88 : 64,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 8,
      },
    }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TrishulIcon focused={focused} /> }} />
      <Tabs.Screen name="yoga" options={{ tabBarIcon: ({ focused }) => <LotusIcon focused={focused} /> }} />
      <Tabs.Screen name="meditation" options={{ tabBarIcon: ({ focused }) => <OmIcon focused={focused} /> }} />
      <Tabs.Screen name="focus" options={{ tabBarIcon: ({ focused }) => <MeruIcon focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  icon: { fontSize: 26 },
  omIcon: { fontSize: 26, fontFamily: 'serif' },
});
