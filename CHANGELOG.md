# Changelog — lmk-mobile

Toutes les modifications notables de ce dépôt sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added — CI GitHub Actions
- `.github/workflows/ci-mobile.yml` — CI sur PR vers `dev`/`main` et push sur `dev`,
  symétrique de la CI backend. Trois jobs :
  - `lint-typecheck` — `npm ci` → `tsc --noEmit` → `eslint . --max-warnings 0`
    (container `node:20-bullseye-slim`).
  - `test` — `npm ci` → `jest` (`--watchAll=false --passWithNoTests`), 73 tests
    (container `node:20-bullseye-slim`, `needs: lint-typecheck`).
  - `expo-check` — `expo install --check` via `expo/expo-github-action@v8` sur
    runner natif (mode container non supporté par l'action), `needs: lint-typecheck`.
  - `node_modules` mis en cache (`actions/cache`, clé = hash de `package-lock.json`).
  - Tout échec bloque la PR. Secret optionnel `EXPO_TOKEN`.
- `README.md` / `CLAUDE.md` — section CI.
