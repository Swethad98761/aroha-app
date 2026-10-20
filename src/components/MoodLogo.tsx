// src/components/MoodLogo.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Image } from 'react-native';

interface MoodLogoProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'silver' | 'red';
}

const SIZES = { sm: 36, md: 52, lg: 72 };
const LOGO_IMAGES = {
  silver: require('../../assets/logo.png'),
  red: require('../../assets/logo_red.png'),
};

export function MoodLogo({ color, size = 'md', variant = 'silver' }: MoodLogoProps) {
  const glow = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const dim = SIZES[size];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -2, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [color]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });
  const borderWidth = dim * 0.045;
  const innerDim = dim - borderWidth * 2;
  const spinInset = dim * 0.15;

  return (
    <Animated.View style={[{ width: dim, height: dim }, { transform: [{ translateY: float }] }]}>
      {/* Glow halo */}
      <Animated.View style={{
        position: 'absolute',
        width: dim * 1.3,
        height: dim * 1.3,
        borderRadius: dim,
        backgroundColor: color,
        opacity: glowOpacity,
        top: -(dim * 0.15),
        left: -(dim * 0.15),
        // blur effect via shadow
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: dim * 0.3,
      }} />

      {/* Dark circle with colored border */}
      <View style={{
        position: 'absolute',
        inset: 0,
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: '#0A0A0A',
        borderWidth: borderWidth,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      }}>
        {/* Spinning ring */}
        <Animated.View style={{
          position: 'absolute',
          top: spinInset - borderWidth,
          left: spinInset - borderWidth,
          right: spinInset - borderWidth,
          bottom: spinInset - borderWidth,
          borderRadius: dim,
          borderWidth: 1,
          borderColor: color,
          opacity: 0.35,
          transform: [{ rotate }],
        }} />

        {/* Logo image fills the circle */}
        <Image
          source={LOGO_IMAGES[variant]}
          style={{
            width: innerDim * 0.88,
            height: innerDim * 0.88,
            borderRadius: innerDim,
          }}
          resizeMode="cover"
        />
      </View>
    </Animated.View>
  );
}
