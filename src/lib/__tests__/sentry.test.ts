/* eslint-env jest */
import * as Sentry from '@sentry/react-native';
import { initSentry } from '../sentry';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
}));

const mockInit = Sentry.init as jest.Mock;
const ORIGINAL_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

describe('initSentry', () => {
  beforeEach(() => {
    mockInit.mockClear();
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = ORIGINAL_DSN;
  });

  it('does not initialize Sentry when the DSN is empty', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = '';
    expect(initSentry()).toBe(false);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('does not initialize Sentry when the DSN is undefined', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    expect(initSentry()).toBe(false);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('initializes Sentry with the DSN when one is provided', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://example@o0.ingest.sentry.io/0';
    expect(initSentry()).toBe(true);
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://example@o0.ingest.sentry.io/0' }),
    );
  });
});
