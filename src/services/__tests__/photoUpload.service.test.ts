import { authService } from '../auth.service';
import { alertsService } from '../alerts.service';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

const mockedApi = api as unknown as { post: jest.Mock; get: jest.Mock };

const RAW_USER = {
  id: 'u1',
  email: 'a@b.fr',
  pseudo: 'av',
  first_name: null,
  last_name: null,
  avatar_url: 'http://minio.test/lmk-media/avatars/u1/x.png',
  score: 100,
  is_verified: true,
  created_at: '2026-06-01T00:00:00Z',
};

const ASSET = { uri: 'file://a.png', mimeType: 'image/png', fileName: 'a.png' };

beforeEach(() => {
  mockedApi.post.mockReset();
  mockedApi.get.mockReset();
});

describe('authService.uploadAvatar', () => {
  it('[V1.5] POST multipart vers /users/me/avatar et mappe l\'utilisateur', async () => {
    mockedApi.post.mockResolvedValue({ data: RAW_USER });
    const user = await authService.uploadAvatar(ASSET);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    const [url, , config] = mockedApi.post.mock.calls[0];
    expect(url).toBe('/api/v1/users/me/avatar');
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
    expect(user.avatarUrl).toBe(RAW_USER.avatar_url);
  });
});

describe('alertsService.uploadPhoto', () => {
  it('[V1.5] POST multipart vers /alerts/photo et renvoie l\'URL', async () => {
    mockedApi.post.mockResolvedValue({ data: { url: 'http://minio.test/lmk-media/alerts/u1/p.png' } });
    const url = await alertsService.uploadPhoto(ASSET);

    expect(mockedApi.post.mock.calls[0][0]).toBe('/api/v1/alerts/photo');
    expect(url).toBe('http://minio.test/lmk-media/alerts/u1/p.png');
  });
});

describe('alertsService.create with photo', () => {
  it('[V1.5] envoie photo_url dans le body', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        id: 'a1',
        user_id: 'u1',
        type: 'PICKPOCKET',
        lat: 48.8,
        lon: 2.3,
        location_label: 'Châtelet',
        status: 'ACTIVE',
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
        expires_at: null,
        comment: null,
        photo_url: 'http://minio.test/lmk-media/alerts/u1/p.png',
        radius_m: 100,
      },
    });
    const alert = await alertsService.create({
      type: 'PICKPOCKET',
      lat: 48.8,
      lon: 2.3,
      locationLabel: 'Châtelet',
      photoUrl: 'http://minio.test/lmk-media/alerts/u1/p.png',
    });

    const body = mockedApi.post.mock.calls[0][1];
    expect(body.photo_url).toBe('http://minio.test/lmk-media/alerts/u1/p.png');
    expect(alert.photoUrl).toBe('http://minio.test/lmk-media/alerts/u1/p.png');
  });

  it('[V1.5] envoie photo_url=null quand aucune photo', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        id: 'a2', user_id: 'u1', type: 'PICKPOCKET', lat: 48.8, lon: 2.3,
        location_label: 'X', status: 'ACTIVE', created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z', expires_at: null, comment: null,
        photo_url: null, radius_m: 500,
      },
    });
    await alertsService.create({ type: 'PICKPOCKET', lat: 48.8, lon: 2.3, locationLabel: 'X' });
    expect(mockedApi.post.mock.calls[0][1].photo_url).toBeNull();
  });
});
