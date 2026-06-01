import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

// Fallback used when GPS is unavailable (simulator / no signal)
const FALLBACK_LAT = 48.8566;
const FALLBACK_LON = 2.3522;

interface LocationState {
  lat: number | null;
  lon: number | null;
  error: string | null;
  loading: boolean;
  isApproximate: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lon: null,
    error: null,
    loading: true,
    isApproximate: false,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ lat: FALLBACK_LAT, lon: FALLBACK_LON, error: 'Permission refusée — position approximative utilisée', loading: false, isApproximate: true });
        return;
      }

      // 1. Try last known position for an immediate result
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          setState({ lat: last.coords.latitude, lon: last.coords.longitude, error: null, loading: false, isApproximate: false });
        }
      } catch {
        // no last known position — continue
      }

      // 2. Force a fresh GPS fix
      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!cancelled) {
          setState({ lat: current.coords.latitude, lon: current.coords.longitude, error: null, loading: false, isApproximate: false });
        }
      } catch (err) {
        console.warn('[useLocation] GPS unavailable:', err);
        if (!cancelled) {
          // 3. Fallback to Paris centre so the form stays usable
          setState({ lat: FALLBACK_LAT, lon: FALLBACK_LON, error: 'GPS indisponible — position approximative (Paris)', loading: false, isApproximate: true });
        }
      }

      if (cancelled) return;

      // 4. Keep watching for better fixes when GPS becomes available
      try {
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (loc) => {
            if (!cancelled) {
              setState({ lat: loc.coords.latitude, lon: loc.coords.longitude, error: null, loading: false, isApproximate: false });
            }
          },
        );
      } catch {
        // watchPosition not available — already have a fallback
      }
    }

    start();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return state;
}
