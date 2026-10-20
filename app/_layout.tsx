import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppStoreProvider } from '../src/store/AppStore';
import { AuthStoreProvider, useAuth } from '../src/store/AuthStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAppStore } from '../src/store/AppStore';
import LoginScreen from '../src/screens/auth/LoginScreen';
import UsernameScreen from '../src/screens/auth/UsernameScreen';
import OnboardingScreen from '../src/screens/onboarding/OnboardingScreen';

function AppGate({ children }: { children: React.ReactNode }) {
  const { userId, emailVerified, username, onboardingDone, isLoading } = useAuth();
  const { initialized, initializationError } = useAppStore();
  if (isLoading) return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#FF5500" size="large" />
    </View>
  );
  if (!userId || !emailVerified) return <LoginScreen />;
  if (!initialized) return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {initializationError ? (
        <Text style={{ color: '#8B1E1E', textAlign: 'center' }}>
          Aroha could not open its local database: {initializationError}
        </Text>
      ) : (
        <ActivityIndicator color="#FF5500" size="large" />
      )}
    </View>
  );
  if (!username) return <UsernameScreen />;
  if (!onboardingDone) return <OnboardingScreen />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthStoreProvider>
        <AppStoreProvider>
          <StatusBar style="auto" />
          <AppGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </AppGate>
        </AppStoreProvider>
      </AuthStoreProvider>
    </GestureHandlerRootView>
  );
}
