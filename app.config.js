// Dynamic Expo config — extends the static app.json.
// Its only job is to inject the Android Google Maps API key from the
// environment (EXPO_PUBLIC_MAPS_API_KEY) so the key is NEVER committed.
// Everything else (name, plugins, permissions, …) stays in app.json.
//
// Expo evaluates app.json first and passes its `expo` block as `config` here.
//
// To build the demo APK with a working map, set the key before building, e.g.:
//   EXPO_PUBLIC_MAPS_API_KEY=AIza... eas build -p android --profile preview
// Without the key the app still installs and runs, but the Android map tiles
// render blank (react-native-maps requires a Google Maps key on Android).
export default ({ config }) => {
  const mapsApiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(mapsApiKey
          ? { googleMaps: { apiKey: mapsApiKey } }
          : {}),
      },
    },
  };
};
