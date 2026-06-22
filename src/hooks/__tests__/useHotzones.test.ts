import { renderHook, waitFor } from '@testing-library/react-native';
import { useHotzones } from '../useHotzones';
import { hotzonesService } from '@/services/hotzones.service';

jest.mock('@/services/hotzones.service', () => ({
  hotzonesService: { list: jest.fn() },
}));

const mocked = hotzonesService as unknown as { list: jest.Mock };

const ZONES = [{ geohash: 'u09tvw', lat: 48.85, lon: 2.35, count: 6, types: ['PICKPOCKET'] }];

describe('[V1.5] useHotzones', () => {
  beforeEach(() => mocked.list.mockReset());

  it('charge les zones chaudes au montage', async () => {
    mocked.list.mockResolvedValue(ZONES);
    const { result } = renderHook(() => useHotzones());
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].count).toBe(6);
  });

  it('erreur (feature off / réseau) → liste vide, pas de crash', async () => {
    mocked.list.mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useHotzones());
    await waitFor(() => expect(mocked.list).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });
});
