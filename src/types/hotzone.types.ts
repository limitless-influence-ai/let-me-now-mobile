// [V1.5] Zone chaude : cellule où >= 5 alertes ont expiré sur 24 h (backend).
export interface HotZone {
  geohash: string;
  lat: number;
  lon: number;
  count: number;
  types: string[];
}
