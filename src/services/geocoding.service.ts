import * as Location from 'expo-location';
import * as Sentry from '@sentry/react-native';

type GeocodeResult = Location.LocationGeocodedAddress;

/**
 * Pure helper — builds a readable "<street/name>, <city>" label from a single
 * reverse-geocode result. Falls back gracefully to whatever fields exist.
 * Returns null when no usable field is present so the caller can use coords.
 */
export function formatGeocodeLabel(result: GeocodeResult | null | undefined): string | null {
  if (!result) return null;

  const streetNumber = result.streetNumber?.trim();
  const street = result.street?.trim() || result.name?.trim();
  const city =
    result.city?.trim() || result.subregion?.trim() || result.region?.trim();

  const streetPart = street
    ? streetNumber
      ? `${streetNumber} ${street}`
      : street
    : null;

  const parts = [streetPart, city].filter((p): p is string => Boolean(p));
  if (parts.length === 0) return null;

  return parts.join(', ');
}

/**
 * Reverse-geocodes coordinates into a human place name using the OS geocoder
 * (no API key required). Never throws and never blocks alert creation — on any
 * failure or empty result it falls back to the formatted coordinate string.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const coordFallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    return formatGeocodeLabel(results[0]) ?? coordFallback;
  } catch (err) {
    Sentry.captureException(err);
    return coordFallback;
  }
}
