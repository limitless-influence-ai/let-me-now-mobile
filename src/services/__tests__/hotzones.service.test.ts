import { hotzonesService } from '../hotzones.service';
import api from '../api';

jest.mock('../api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/demo/mock', () => ({ __esModule: true, DEMO_MODE: false }));

const mockedApi = api as unknown as { get: jest.Mock };

describe('[V1.5] hotzonesService.list', () => {
  beforeEach(() => mockedApi.get.mockReset());

  it('GET /alerts/hotzones et mappe les zones', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        items: [
          { geohash: 'u09tvw', lat: 48.85, lon: 2.35, count: 6, types: ['PICKPOCKET'] },
        ],
        total: 1,
      },
    });
    const zones = await hotzonesService.list();
    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/alerts/hotzones');
    expect(zones).toHaveLength(1);
    expect(zones[0]).toEqual({ geohash: 'u09tvw', lat: 48.85, lon: 2.35, count: 6, types: ['PICKPOCKET'] });
  });

  it('réponse vide → liste vide (pas de crash)', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [], total: 0 } });
    expect(await hotzonesService.list()).toEqual([]);
  });
});
