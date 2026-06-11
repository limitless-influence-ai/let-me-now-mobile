import api from './api';
import { DEMO_MODE } from '@/demo/mock';

export const usersService = {
  // PATCH the user's last known position so the backend can geo-filter
  // proximity push notifications. Returns the updated user (ignored here).
  updateLocation: async (lat: number, lon: number): Promise<void> => {
    if (DEMO_MODE) return;
    await api.patch('/api/v1/users/me/location', { lat, lon });
  },
};
