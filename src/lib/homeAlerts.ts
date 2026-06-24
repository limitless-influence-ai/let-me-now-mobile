/**
 * [Accueil] Calcul pur des « alertes proches » affichées sur la page d'accueil.
 *
 * Filtre les alertes actives visibles (même règles que la carte : type visible,
 * Cactus réservé aux connectés), calcule la distance à l'utilisateur et trie du
 * plus proche au plus loin. Sans logique de rendu → testable.
 */
import { Alert } from '@/types/alert.types';
import { FEATURES } from '@/constants/config';
import { isAlertTypeVisible } from '@/lib/featureGuards';
import { haversineM } from '@/lib/geo';

export interface NearbyAlert extends Alert {
  distanceM: number;
}

export function nearbyAlerts(
  alerts: Alert[],
  lat: number,
  lon: number,
  connected: boolean,
): NearbyAlert[] {
  return alerts
    .filter(
      (a) =>
        a.status === 'active' &&
        isAlertTypeVisible(a.type, FEATURES.CACTUS_ENABLED) &&
        !(a.type === 'CACTUS' && !connected),
    )
    .map((a) => ({ ...a, distanceM: Math.round(haversineM(lat, lon, a.lat, a.lon)) }))
    .sort((x, y) => x.distanceM - y.distanceM);
}
