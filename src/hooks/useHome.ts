/**
 * [Accueil] Logique de la page d'accueil — hors JSX (clean code).
 *
 * Compose la position, les alertes proches (REST), les zones chaudes et le statut
 * de connexion. Le visiteur a un instantané REST rafraîchissable (pull-to-refresh) ;
 * le connecté reçoit le temps réel via le WebSocket (monté dans l'écran).
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useLocation } from '@/hooks/useLocation';
import { useAlerts } from '@/hooks/useAlerts';
import { useHotzones } from '@/hooks/useHotzones';
import { nearbyAlerts, NearbyAlert } from '@/lib/homeAlerts';
import { CONFIG } from '@/constants/config';

type HomeStatus = 'loading' | 'ready' | 'error';

export interface UseHomeResult {
  connected: boolean;
  status: HomeStatus;
  refreshing: boolean;
  refresh: () => Promise<void>;
  nearby: NearbyAlert[];
  hotzones: ReturnType<typeof useHotzones>;
  lat: number | null;
  lon: number | null;
}

export function useHome(): UseHomeResult {
  const user = useAuthStore((s) => s.user);
  const connected = !!user;
  const { lat, lon, loading: locLoading } = useLocation();
  const { alerts, fetchAlerts } = useAlerts();
  const hotzones = useHotzones(alerts.length);

  const [status, setStatus] = useState<HomeStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (lat === null || lon === null) return;
    try {
      await fetchAlerts(lat, lon, CONFIG.DEFAULT_RADIUS_M);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [lat, lon, fetchAlerts]);

  // Premier chargement dès que la position est disponible (volontairement
  // déclenché sur lat/lon uniquement — `load` se recrée avec ces mêmes deps).
  useEffect(() => {
    if (lat !== null && lon !== null) load();
  }, [lat, lon, load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const nearby = lat !== null && lon !== null ? nearbyAlerts(alerts, lat, lon, connected) : [];

  // Tant que la position se charge OU que le 1er fetch n'a pas abouti → loading.
  const effectiveStatus: HomeStatus = locLoading && status === 'loading' ? 'loading' : status;

  return { connected, status: effectiveStatus, refreshing, refresh, nearby, hotzones, lat, lon };
}
