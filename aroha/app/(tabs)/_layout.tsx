// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors, AppTheme } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppTheme.workouts.accentColor,
        tabBarInactiveTintColor: Colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.separator,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 82 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🏋️" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="yoga"
        options={{
          title: 'Yoga',
          tabBarActiveTintColor: AppTheme.yoga.accentColor,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🧘" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meditation"
        options={{
          title: 'Meditation',
          tabBarActiveTintColor: AppTheme.meditation.accentColor,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🧠" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarActiveTintColor: AppTheme.workouts.accentColor,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🎯" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, focused, color }: { emoji: string; focused: boolean; color: string }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}
