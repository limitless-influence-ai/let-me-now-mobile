/**
 * Style de carte Google « Refined Street » — désaturé, routes claires, eau douce,
 * bruit (POI/commerces) masqué, pour s'harmoniser avec le design system.
 *
 * Appliqué via la prop `customMapStyle` de react-native-maps (provider Google).
 * Ignoré par Apple Maps (iOS / Expo Go) — voir note dans la PR pour le câblage
 * du provider Google + clé API en dev build.
 */
import type { MapStyleElement } from 'react-native-maps';

export const MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#f4f5f4' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e93' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fafafa' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e3efe6' }, { visibility: 'on' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9a9a9f' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f0e9e1' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e7' }, { visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe6ee' }] },
];
