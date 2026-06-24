import { alertsService } from '../alerts.service';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };

beforeEach(() => {
  mockedApi.get.mockReset();
  mockedApi.post.mockReset();
});

describe('alertsService.getMyVote', () => {
  it('[V1.5] renvoie le type de vote courant', async () => {
    mockedApi.get.mockResolvedValue({ data: { type: 'CONFIRM' } });
    const v = await alertsService.getMyVote('a1');
    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/alerts/a1/votes/me');
    expect(v).toBe('CONFIRM');
  });

  it('[V1.5] renvoie null si pas de vote (type=null)', async () => {
    mockedApi.get.mockResolvedValue({ data: { type: null } });
    expect(await alertsService.getMyVote('a1')).toBeNull();
  });

  it('[V1.5] renvoie null sans crash si l\'endpoint échoue (404 flag off)', async () => {
    mockedApi.get.mockRejectedValue({ response: { status: 404 } });
    expect(await alertsService.getMyVote('a1')).toBeNull();
  });
});
