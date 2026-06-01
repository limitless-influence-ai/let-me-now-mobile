import { usersService } from '../users.service';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: { patch: jest.fn().mockResolvedValue({ data: {} }) },
}));

const mockedApi = api as unknown as { patch: jest.Mock };

describe('usersService.updateLocation', () => {
  beforeEach(() => {
    mockedApi.patch.mockClear();
  });

  it('PATCHes the location endpoint with lat/lon body', async () => {
    await usersService.updateLocation(48.8566, 2.3522);
    expect(mockedApi.patch).toHaveBeenCalledTimes(1);
    expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/users/me/location', {
      lat: 48.8566,
      lon: 2.3522,
    });
  });

  it('resolves to void', async () => {
    await expect(usersService.updateLocation(1, 2)).resolves.toBeUndefined();
  });
});
