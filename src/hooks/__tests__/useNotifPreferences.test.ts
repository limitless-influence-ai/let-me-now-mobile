import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotifPreferences } from '../useNotifPreferences';
import { preferencesService } from '@/services/preferences.service';

jest.mock('@/services/preferences.service', () => ({
  preferencesService: { get: jest.fn(), update: jest.fn() },
  DEFAULT_PREFERENCES: {
    notifAgression: true,
    notifHomophobe: true,
    notifPickpocket: true,
    notifCactus: true,
    notifRadiusM: 500,
  },
}));

const mocked = preferencesService as unknown as { get: jest.Mock; update: jest.Mock };

const SERVER = {
  notifAgression: false,
  notifHomophobe: true,
  notifPickpocket: true,
  notifCactus: true,
  notifRadiusM: 700,
};

describe('useNotifPreferences', () => {
  beforeEach(() => {
    mocked.get.mockReset();
    mocked.update.mockReset();
  });

  it('[V1.5] chargement → reflète les vraies préférences (GET)', async () => {
    mocked.get.mockResolvedValue(SERVER);
    const { result } = renderHook(() => useNotifPreferences());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocked.get).toHaveBeenCalledTimes(1);
    expect(result.current.prefs).toEqual(SERVER);
    expect(result.current.error).toBeNull();
  });

  it('[V1.5] modification → PATCH + persistance de la valeur renvoyée', async () => {
    mocked.get.mockResolvedValue(SERVER);
    mocked.update.mockResolvedValue({ ...SERVER, notifPickpocket: false });
    const { result } = renderHook(() => useNotifPreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.update({ notifPickpocket: false });
    });

    expect(mocked.update).toHaveBeenCalledWith({ notifPickpocket: false });
    expect(result.current.prefs.notifPickpocket).toBe(false);
  });

  it('[V1.5] échec PATCH → revert + message d\'erreur', async () => {
    mocked.get.mockResolvedValue(SERVER);
    mocked.update.mockRejectedValue({ response: { data: { message: 'Boom' } } });
    const { result } = renderHook(() => useNotifPreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.update({ notifPickpocket: false });
    });

    // Revert à la valeur serveur, erreur exposée.
    expect(result.current.prefs.notifPickpocket).toBe(true);
    expect(result.current.error).toBe('Boom');
  });
});
