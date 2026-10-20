// src/hooks/useLiveSteps.ts
// Automatic real-time step tracking.
// iOS: pulls true all-day totals from Apple's motion coprocessor (works even if
//      the app was closed all day), refined live via watchStepCount while open.
// Android: live count while the app is open (foreground service for true
//      all-day background tracking is a future phase — see handoff notes).
import { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { logSteps, getTodaySteps, StepEntry } from '../db/stepTracker';

export type LiveStepsStatus = {
  isAvailable: boolean | null;
  permissionGranted: boolean | null;
};

export function useLiveSteps(onUpdate?: (entry: StepEntry) => void): LiveStepsStatus {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const baseStepsRef = useRef(0);

  function commitSteps(steps: number) {
    if (steps < 0) return;
    const entry = logSteps(Math.round(steps));
    onUpdate?.(entry);
  }

  async function syncFromHistory() {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      const result = await Pedometer.getStepCountAsync(start, end);
      commitSteps(result.steps);
    } catch (e) {
      console.log('[useLiveSteps] history sync failed', e);
    }
  }

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    let appStateSub: { remove: () => void } | undefined;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    (async () => {
      const available = await Pedometer.isAvailableAsync();
      if (cancelled) return;
      setIsAvailable(available);
      if (!available) return;

      const perm = await Pedometer.requestPermissionsAsync();
      if (cancelled) return;
      setPermissionGranted(perm.granted);
      if (!perm.granted) return;

      if (Platform.OS === 'ios') {
        // Ground truth: query the coprocessor's full-day history immediately.
        await syncFromHistory();
        // Live nudges: on every pedometer event, throttle-resync from history
        // so we always show the true cumulative total (no manual math needed).
        subscription = Pedometer.watchStepCount(() => {
          if (throttleTimer) return;
          throttleTimer = setTimeout(async () => {
            await syncFromHistory();
            throttleTimer = null;
          }, 3000);
        });
      } else {
        // Android: no historical query API. Start from whatever's already
        // logged today and add live deltas on top while the app is open.
        const existing = getTodaySteps();
        const today = new Date().toISOString().slice(0, 10);
        const isToday = !!existing && existing.date.slice(0, 10) === today;
        baseStepsRef.current = isToday ? existing!.steps : 0;
        subscription = Pedometer.watchStepCount((result) => {
          commitSteps(baseStepsRef.current + result.steps);
        });
      }
    })();

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active' && Platform.OS === 'ios') {
        syncFromHistory();
      }
    };
    appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cancelled = true;
      subscription?.remove?.();
      appStateSub?.remove?.();
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  return { isAvailable, permissionGranted };
}
