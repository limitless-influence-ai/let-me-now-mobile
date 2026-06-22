import { authService } from '../auth.service';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: { patch: jest.fn() },
}));

// Le service lit DEMO_MODE depuis le module mock — on force le mode réel.
jest.mock('@/demo/mock', () => ({
  __esModule: true,
  DEMO_MODE: false,
  DEMO_USER: {},
  DEMO_TOKENS: {},
}));

const mockedApi = api as unknown as { patch: jest.Mock };

const RAW_ME = {
  id: 'u1',
  email: 'a@b.c',
  pseudo: 'newpseudo',
  first_name: null,
  last_name: null,
  avatar_url: null,
  score: 100,
  is_verified: true,
  is_banned: false,
  banned_until: null,
  pseudo_changed_at: '2026-06-22T12:00:00.000Z',
  pseudo_next_change_at: '2026-07-06T12:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('[V1.5] authService.updatePseudo', () => {
  beforeEach(() => mockedApi.patch.mockReset());

  it('PATCH /users/me avec le pseudo et mappe la réponse (dont éligibilité)', async () => {
    mockedApi.patch.mockResolvedValue({ data: RAW_ME });
    const user = await authService.updatePseudo('newpseudo');

    expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/users/me', { pseudo: 'newpseudo' });
    expect(user.pseudo).toBe('newpseudo');
    expect(user.pseudoChangedAt).toBe('2026-06-22T12:00:00.000Z');
    expect(user.pseudoNextChangeAt).toBe('2026-07-06T12:00:00.000Z');
  });

  it('propage l\'erreur backend (ex: cooldown 409) pour l\'écran', async () => {
    mockedApi.patch.mockRejectedValue({
      response: { status: 409, data: { error_code: 'PSEUDO_CHANGE_TOO_SOON', params: { days_remaining: 9 } } },
    });
    await expect(authService.updatePseudo('x')).rejects.toMatchObject({
      response: { data: { error_code: 'PSEUDO_CHANGE_TOO_SOON' } },
    });
  });
});
