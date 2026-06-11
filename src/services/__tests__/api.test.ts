import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

jest.mock('axios', () => {
  // A callable axios instance: invoking it (the retry `return api(original)`)
  // resolves to a sentinel so we can assert the original request was replayed.
  // Built inside the factory to avoid the temporal-dead-zone trap (the factory
  // runs at import time, before module-scope consts are initialised).
  const instance: jest.Mock & { interceptors?: unknown } = jest
    .fn()
    .mockResolvedValue({ data: 'retried' });
  instance.interceptors = {
    request: { use: jest.fn() },
    response: {
      use: (_onSuccess: unknown, onError: (e: unknown) => Promise<unknown>) => {
        (globalThis as Record<string, unknown>).__apiResponseErrorHandler = onError;
      },
    },
  };
  const create = jest.fn(() => instance);
  return { __esModule: true, default: { create, post: jest.fn(), __instance: instance } };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockedStore = SecureStore as unknown as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};
const mockedAxiosPost = (axios as unknown as { post: jest.Mock }).post;
const mockApiInstance = (axios as unknown as { __instance: jest.Mock }).__instance;

// Import for its side effect: registers the interceptors via the mocked axios.
import '../api';

// The handler the interceptor registered, captured onto globalThis by the mock.
const responseErrorHandler = (globalThis as Record<string, unknown>)
  .__apiResponseErrorHandler as (error: unknown) => Promise<unknown>;

function build401(): { response: { status: number }; config: Record<string, unknown> } {
  return {
    response: { status: 401 },
    config: { url: '/api/v1/alerts', headers: {} },
  };
}

describe('api refresh interceptor — rotated token persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks wipes the default resolved value — restore the retry sentinel.
    mockApiInstance.mockResolvedValue({ data: 'retried' });
    useAuthStore.setState({
      user: { id: 'u1' } as never,
      tokens: { accessToken: 'a', refreshToken: 'r' } as never,
    });
  });

  it('persists a NEW refresh_token on every refresh cycle', async () => {
    // --- Cycle 1 ---
    mockedStore.getItemAsync.mockResolvedValueOnce('refresh-1');
    mockedAxiosPost.mockResolvedValueOnce({
      data: { access_token: 'access-1', refresh_token: 'refresh-2' },
    });
    await responseErrorHandler(build401());

    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-1');
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-2');

    // --- Cycle 2 --- (a fresh request 401s again later)
    mockedStore.getItemAsync.mockResolvedValueOnce('refresh-2');
    mockedAxiosPost.mockResolvedValueOnce({
      data: { access_token: 'access-2', refresh_token: 'refresh-3' },
    });
    await responseErrorHandler(build401());

    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-2');
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-3');

    // The rotated token was persisted on each cycle (2 access + 2 refresh writes).
    expect(mockedStore.setItemAsync).toHaveBeenCalledTimes(4);
  });

  it('replays the original request after a successful refresh', async () => {
    mockedStore.getItemAsync.mockResolvedValueOnce('refresh-1');
    mockedAxiosPost.mockResolvedValueOnce({
      data: { access_token: 'access-1', refresh_token: 'refresh-2' },
    });
    const result = await responseErrorHandler(build401());
    expect(result).toEqual({ data: 'retried' });
    expect(mockApiInstance).toHaveBeenCalledTimes(1);
  });

  it('clears SecureStore AND the Zustand store when refresh fails', async () => {
    mockedStore.getItemAsync.mockResolvedValueOnce('refresh-1');
    mockedAxiosPost.mockRejectedValueOnce(new Error('401 invalid refresh'));

    await expect(responseErrorHandler(build401())).rejects.toBeDefined();

    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().tokens).toBeNull();
  });
});
