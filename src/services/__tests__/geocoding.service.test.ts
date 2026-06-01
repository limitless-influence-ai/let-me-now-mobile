/* eslint-env jest */
import type * as Location from 'expo-location';

// --- mocks (declared before importing the unit under test) ---------------

const mockReverseGeocodeAsync = jest.fn();
jest.mock('expo-location', () => ({
  reverseGeocodeAsync: (...args: unknown[]) => mockReverseGeocodeAsync(...args),
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

import { formatGeocodeLabel, reverseGeocode } from '../geocoding.service';
import * as Sentry from '@sentry/react-native';

type Addr = Partial<Location.LocationGeocodedAddress>;

function addr(overrides: Addr = {}): Location.LocationGeocodedAddress {
  return {
    city: null,
    country: null,
    district: null,
    streetNumber: null,
    street: null,
    region: null,
    subregion: null,
    postalCode: null,
    name: null,
    isoCountryCode: null,
    timezone: null,
    formattedAddress: null,
    ...overrides,
  } as Location.LocationGeocodedAddress;
}

describe('formatGeocodeLabel', () => {
  it('builds "street, city" from a full result', () => {
    expect(formatGeocodeLabel(addr({ street: 'Rue de Rivoli', city: 'Paris' }))).toBe(
      'Rue de Rivoli, Paris',
    );
  });

  it('prepends the street number when present', () => {
    expect(
      formatGeocodeLabel(addr({ streetNumber: '10', street: 'Rue de Rivoli', city: 'Paris' })),
    ).toBe('10 Rue de Rivoli, Paris');
  });

  it('falls back to name when street is missing', () => {
    expect(formatGeocodeLabel(addr({ name: 'Châtelet', city: 'Paris' }))).toBe('Châtelet, Paris');
  });

  it('uses subregion then region when city is missing', () => {
    expect(formatGeocodeLabel(addr({ street: 'Rue X', subregion: 'Paris 1er' }))).toBe(
      'Rue X, Paris 1er',
    );
    expect(formatGeocodeLabel(addr({ street: 'Rue X', region: 'Île-de-France' }))).toBe(
      'Rue X, Île-de-France',
    );
  });

  it('returns just the city when only a city is present', () => {
    expect(formatGeocodeLabel(addr({ city: 'Paris' }))).toBe('Paris');
  });

  it('returns just the name when only a name is present', () => {
    expect(formatGeocodeLabel(addr({ name: 'Tour Eiffel' }))).toBe('Tour Eiffel');
  });

  it('returns null for an empty result (no usable field)', () => {
    expect(formatGeocodeLabel(addr())).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(formatGeocodeLabel(null)).toBeNull();
    expect(formatGeocodeLabel(undefined)).toBeNull();
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a formatted label from the first result', async () => {
    mockReverseGeocodeAsync.mockResolvedValue([
      addr({ street: 'Rue de Rivoli', city: 'Paris' }),
      addr({ city: 'Other' }),
    ]);
    await expect(reverseGeocode(48.8566, 2.3522)).resolves.toBe('Rue de Rivoli, Paris');
    expect(mockReverseGeocodeAsync).toHaveBeenCalledWith({ latitude: 48.8566, longitude: 2.3522 });
  });

  it('falls back to coords on an empty array', async () => {
    mockReverseGeocodeAsync.mockResolvedValue([]);
    await expect(reverseGeocode(48.8566, 2.3522)).resolves.toBe('48.8566, 2.3522');
  });

  it('falls back to coords when the first result has no usable field', async () => {
    mockReverseGeocodeAsync.mockResolvedValue([addr()]);
    await expect(reverseGeocode(1.23456, 7.89123)).resolves.toBe('1.2346, 7.8912');
  });

  it('falls back to coords and reports to Sentry when the geocoder throws', async () => {
    mockReverseGeocodeAsync.mockRejectedValue(new Error('geocoder unavailable'));
    await expect(reverseGeocode(48.8566, 2.3522)).resolves.toBe('48.8566, 2.3522');
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
