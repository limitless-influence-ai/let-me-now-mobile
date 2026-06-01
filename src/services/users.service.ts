import api from './api';

export const usersService = {
  // PATCH the user's last known position so the backend can geo-filter
  // proximity push notifications. Returns the updated user (ignored here).
  updateLocation: async (lat: number, lon: number): Promise<void> => {
    await api.patch('/api/v1/users/me/location', { lat, lon });
  },
};
