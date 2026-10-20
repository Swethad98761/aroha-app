// src/hooks/useCompassHeading.ts
// Live compass heading using the OS's own calibrated heading service (the
// same source iOS/Android's built-in Compass app reads from), rather than
// computing it ourselves from raw magnetometer vectors — raw-vector math
// is easy to get backwards/offset and won't match the real Compass app.
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export function useCompassHeading(): { heading: number; available: boolean | null } {
  const [heading, setHeading] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setAvailable(false);
        return;
      }
      setAvailable(true);
      subscription = await Location.watchHeadingAsync((data) => {
        const value = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        setHeading(value);
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, []);

  return { heading, available };
}
