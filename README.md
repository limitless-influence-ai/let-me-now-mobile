# LMK — Mobile (Partie 5)

Application mobile **Let Me Know** — signalement de dangers en temps réel (France).

React Native (Expo Prebuild) · iOS & Android · Expo Router

## Stack

- **Expo Router** — file-based routing
- **React Native Maps** — carte interactive
- **WebSocket** — alertes temps réel
- **Zustand** — état global
- **Axios** — appels API
- **Expo SecureStore** — stockage JWT
- **Expo Notifications** — push notifications
- **Sentry** — monitoring erreurs

## Démarrage rapide

```bash
cp .env.example .env
# Remplir EXPO_PUBLIC_API_URL, EXPO_PUBLIC_MAPS_API_KEY
npm install
npx expo start
```

## Structure

```
src/
  app/          ← Écrans (Expo Router file-based)
  components/   ← UI partagée
  hooks/        ← Logique métier
  services/     ← Appels API
  store/        ← État global (Zustand)
  types/        ← Types TypeScript
  constants/    ← Couleurs, config, magic numbers
```

## 11 écrans MVP

| # | Écran | Accès |
|---|---|---|
| 01 | Splash | Tous |
| 02 | Carte principale | Tous |
| 03 | Filtres (bottom sheet) | Tous |
| 04 | Signalement | Connecté |
| 05 | Fiche détail alerte | Tous |
| 06 | Pop-up Cactus | Connecté |
| 07 | Connexion | Tous |
| 08 | Inscription | Tous |
| 09 | Vérification email | Tous |
| 10 | Alertes (liste) | Connecté |
| 11 | Profil + Paramètres | Connecté |

## CI

Workflow GitHub Actions `.github/workflows/ci-mobile.yml`, symétrique de la CI backend.

| Déclencheur | PR vers `dev`/`main` + push sur `dev` |
|---|---|
| `lint-typecheck` | `npm ci` → `tsc --noEmit` → `eslint . --max-warnings 0` (TypeScript strict, zéro `any`) |
| `test` | `npm ci` → `jest` (`npm test -- --watchAll=false --passWithNoTests`) — 73 tests |
| `expo-check` | `expo install --check` (runner natif — `expo-github-action` ne supporte pas le mode container) |

- `node_modules` mis en cache via `actions/cache` (clé = hash de `package-lock.json`).
- Tout échec (type/lint/test/expo) **fait échouer la CI et bloque la PR**.
- Secret optionnel : `EXPO_TOKEN` (Settings → Secrets and variables → Actions) — non requis pour `expo install --check`, utile pour les commandes Expo authentifiées (futur CD/EAS).

## Conception

Diagrammes UML et wireframes : [github.com/kakotodev/LMK](https://github.com/kakotodev/LMK)
# let-me-now-mobile-app
# let-me-now-mobile-app
# let-me-now-mobile
# let-me-now-mobile
