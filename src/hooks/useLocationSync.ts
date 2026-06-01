import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { useLocation } from './useLocation';
import { useAuthStore } from '@/store/auth.store';
import { usersService } from '@/services/users.service';
import { CONFIG } from '@/constants/config';

export interface Coords {
  lat: number;
  lon: number;
}

/**
 * Pure decision: should we push `next` to the backend given the last synced
 * position `prev`? Sends on the first fix (prev === null) and whenever the
 * position moved beyond CONFIG.LOCATION_SYNC_MIN_DELTA_DEG on either axis.
 * Tiny GPS jitter below the threshold is ignored.
 */
export function shouldSyncLocation(prev: Coords | null, next: Coords): boolean {
  if (prev === null) return true;
  return (
    Math.abs(next.lat - prev.lat) >= CONFIG.LOCATION_SYNC_MIN_DELTA_DEG ||
    Math.abs(next.lon - prev.lon) >= CONFIG.LOCATION_SYNC_MIN_DELTA_DEG
  );
}

/**
 * Mount once app-wide. When authenticated and a position is available, syncs
 * the user's position to the backend on first fix and on meaningful moves.
 * Errors are reported to Sentry and swallowed — never crashes the app.
 */
export function useLocationSync(): void {
  const { lat, lon } = useLocation();
  const isAuthenticated = useAuthStore((s) => !!s.user);
  const lastSyncedRef = useRef<Coords | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      lastSyncedRef.current = null;
      return;
    }
    if (lat === null || lon === null) return;

    const next: Coords = { lat, lon };
    if (!shouldSyncLocation(lastSyncedRef.current, next)) return;

    lastSyncedRef.current = next;
    usersService.updateLocation(lat, lon).catch((err) => {
      Sentry.captureException(err);
    });
  }, [lat, lon, isAuthenticated]);
}
