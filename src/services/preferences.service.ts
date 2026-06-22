import api from './api';
import { NotifPreferences } from '@/types/user.types';
import { DEMO_MODE } from '@/demo/mock';

const PREFERENCES_ENDPOINT = '/api/v1/users/me/preferences';

// Valeurs par défaut (miroir du backend) — utilisées en mode démo.
const DEFAULT_PREFERENCES: NotifPreferences = {
  notifAgression: true,
  notifHomophobe: true,
  notifPickpocket: true,
  notifCactus: true,
  notifRadiusM: 500,
};

function mapPreferences(raw: Record<string, unknown>): NotifPreferences {
  return {
    notifAgression: raw.notif_agression as boolean,
    notifHomophobe: raw.notif_homophobe as boolean,
    notifPickpocket: raw.notif_pickpocket as boolean,
    notifCactus: raw.notif_cactus as boolean,
    notifRadiusM: raw.notif_radius_m as number,
  };
}

// camelCase (partiel) → snake_case pour le PATCH ; seuls les champs fournis sont envoyés.
function toSnakePayload(patch: Partial<NotifPreferences>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patch.notifAgression !== undefined) body.notif_agression = patch.notifAgression;
  if (patch.notifHomophobe !== undefined) body.notif_homophobe = patch.notifHomophobe;
  if (patch.notifPickpocket !== undefined) body.notif_pickpocket = patch.notifPickpocket;
  if (patch.notifCactus !== undefined) body.notif_cactus = patch.notifCactus;
  if (patch.notifRadiusM !== undefined) body.notif_radius_m = patch.notifRadiusM;
  return body;
}

export const preferencesService = {
  get: async (): Promise<NotifPreferences> => {
    if (DEMO_MODE) return { ...DEFAULT_PREFERENCES };
    const { data } = await api.get(PREFERENCES_ENDPOINT);
    return mapPreferences(data);
  },

  update: async (patch: Partial<NotifPreferences>): Promise<NotifPreferences> => {
    if (DEMO_MODE) return { ...DEFAULT_PREFERENCES, ...patch };
    const { data } = await api.patch(PREFERENCES_ENDPOINT, toSnakePayload(patch));
    return mapPreferences(data);
  },
};

export { DEFAULT_PREFERENCES };
