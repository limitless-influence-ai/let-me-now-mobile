import api from './api';
import { Alert, AlertCreate } from '@/types/alert.types';
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

  create: async (payload: AlertCreate): Promise<Alert> => {
    if (DEMO_MODE) return registerDemoAlert(payload);
    const { data } = await api.post('/api/v1/alerts', {
      type: payload.type,
      lat: payload.lat,
      lon: payload.lon,
      location_label: payload.locationLabel,
      comment: payload.comment ?? null,
      radius_m: payload.radiusM ?? 500,
    });
    return mapAlert(data);
  },

  vote: async (alertId: string, type: 'CONFIRM' | 'INVALIDATE'): Promise<void> => {
    if (DEMO_MODE) return;
    await api.post(`/api/v1/alerts/${alertId}/votes`, { type });
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
