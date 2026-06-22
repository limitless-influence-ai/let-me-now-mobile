import { preferencesService } from '../preferences.service';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}));

const mockedApi = api as unknown as { get: jest.Mock; patch: jest.Mock };

const RAW = {
  notif_agression: true,
  notif_homophobe: false,
  notif_pickpocket: true,
  notif_cactus: true,
  notif_radius_m: 800,
};

describe('preferencesService.get', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
  });

  it('[V1.5] GET map snake_case -> camelCase', async () => {
    mockedApi.get.mockResolvedValue({ data: RAW });
    const prefs = await preferencesService.get();
    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me/preferences');
    expect(prefs).toEqual({
      notifAgression: true,
      notifHomophobe: false,
      notifPickpocket: true,
      notifCactus: true,
      notifRadiusM: 800,
    });
  });
});

describe('preferencesService.update', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
  });

  it('[V1.5] PATCH n\'envoie que les champs fournis, en snake_case', async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...RAW, notif_pickpocket: false, notif_radius_m: 600 } });
    const saved = await preferencesService.update({ notifPickpocket: false, notifRadiusM: 600 });

    expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/users/me/preferences', {
      notif_pickpocket: false,
      notif_radius_m: 600,
    });
    // Pas de champ non fourni dans le body.
    const body = mockedApi.patch.mock.calls[0][1];
    expect(body).not.toHaveProperty('notif_agression');
    expect(saved.notifPickpocket).toBe(false);
    expect(saved.notifRadiusM).toBe(600);
  });
});
