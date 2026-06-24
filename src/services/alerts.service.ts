import api from './api';
import { Alert, AlertCreate, VoteType } from '@/types/alert.types';
import { buildPhotoFormData, PickedImage } from '@/lib/photoUpload';
import {
  DEMO_MODE,
  buildMockAlerts,
  buildMyMockAlerts,
  findDemoAlert,
  registerDemoAlert,
  removeDemoAlert,
} from '@/demo/mock';

export function mapAlert(raw: Record<string, unknown>): Alert {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    type: raw.type as Alert['type'],
    lat: raw.lat as number,
    lon: raw.lon as number,
    locationLabel: raw.location_label as string,
    status: ((raw.status as string) ?? '').toLowerCase() as Alert['status'],
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
    expiresAt: (raw.expires_at as string | null) ?? null,
    comment: (raw.comment as string | null) ?? null,
    photoUrl: (raw.photo_url as string | null) ?? null,
    radiusM: (raw.radius_m as number | undefined) ?? 500,
  };
}

export const alertsService = {
  list: async (lat: number, lon: number, radiusM: number): Promise<Alert[]> => {
    if (DEMO_MODE) return buildMockAlerts(lat, lon);
    const { data } = await api.get('/api/v1/alerts', { params: { lat, lon, radius_m: radiusM } });
    return (data.items ?? []).map(mapAlert);
  },

  get: async (id: string): Promise<Alert> => {
    if (DEMO_MODE) {
      const alert = findDemoAlert(id);
      if (alert) return alert;
    }
    const { data } = await api.get(`/api/v1/alerts/${id}`);
    return mapAlert(data);
  },

  // [V1.5] Upload d'une photo d'alerte (multipart → MinIO/R2, derrière le flag
  // → 404 si OFF). Renvoie l'URL publique à passer ensuite à create({ photoUrl }).
  uploadPhoto: async (asset: PickedImage): Promise<string> => {
    if (DEMO_MODE) return asset.uri;
    const { data } = await api.post('/api/v1/alerts/photo', buildPhotoFormData(asset), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url as string;
  },

  create: async (payload: AlertCreate): Promise<Alert> => {
    if (DEMO_MODE) return registerDemoAlert(payload);
    const { data } = await api.post('/api/v1/alerts', {
      type: payload.type,
      lat: payload.lat,
      lon: payload.lon,
      location_label: payload.locationLabel,
      comment: payload.comment ?? null,
      radius_m: payload.radiusM ?? 500,
      photo_url: payload.photoUrl ?? null,
    });
    return mapAlert(data);
  },

  vote: async (alertId: string, type: 'CONFIRM' | 'INVALIDATE'): Promise<void> => {
    if (DEMO_MODE) return;
    await api.post(`/api/v1/alerts/${alertId}/votes`, { type });
  },

  // [V1.5] Vote courant de l'utilisateur sur une alerte (null s'il n'a pas voté,
  // ou si la feature est éteinte → 404). Sert à afficher l'état dans la fiche.
  getMyVote: async (alertId: string): Promise<VoteType | null> => {
    if (DEMO_MODE) return null;
    try {
      const { data } = await api.get(`/api/v1/alerts/${alertId}/votes/me`);
      return (data?.type as VoteType | null) ?? null;
    } catch {
      return null;
    }
  },

  listMine: async (): Promise<Alert[]> => {
    if (DEMO_MODE) return buildMyMockAlerts();
    const { data } = await api.get('/api/v1/alerts/mine');
    return (data.items ?? []).map(mapAlert);
  },

  deleteAlert: async (id: string): Promise<void> => {
    if (DEMO_MODE) {
      removeDemoAlert(id);
      return;
    }
    await api.delete(`/api/v1/alerts/${id}`);
  },
};
