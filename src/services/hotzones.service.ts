import api from './api';
import { HotZone } from '@/types/hotzone.types';
import { DEMO_MODE } from '@/demo/mock';

function mapHotZone(raw: Record<string, unknown>): HotZone {
  return {
    geohash: raw.geohash as string,
    lat: raw.lat as number,
    lon: raw.lon as number,
    count: raw.count as number,
    types: (raw.types as string[] | undefined) ?? [],
  };
}

export const hotzonesService = {
  // [V1.5] Zones chaudes. Endpoint masqué (404) si la feature est éteinte côté
  // backend → l'appelant (hook) retombe sur une liste vide sans bloquer la carte.
  list: async (): Promise<HotZone[]> => {
    if (DEMO_MODE) return [];
    const { data } = await api.get('/api/v1/alerts/hotzones');
    return (data.items ?? []).map(mapHotZone);
  },
};
