# Field Vault

React Native (Expo SDK 58) demo app for the US LBM mobile work: an offline, encrypted document vault for field teams. The day-wise plan and daily updates are in [docs/day-wise-plan.md](docs/day-wise-plan.md).

## Setup

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init                 # links the app to an EAS project (adds extra.eas.projectId)
npx eas-cli@latest update:configure     # adds updates.url for EAS Update
npx eas-cli@latest build --profile development --platform android
```

Install the development build on a device or emulator, then run `npm start`.

Expo Go is not supported. SQLCipher, react-native-quick-crypto and expo-updates need a development build.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start Metro for the development build |
| `npm test` | Run unit tests (`test:watch`, `test:coverage` also available) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (eslint-config-expo) |

## Architecture

The project follows Clean Architecture. The rules in [docs/clean-architecture.md](docs/clean-architecture.md) are mandatory, and `npm run lint` enforces the layer boundaries.

```
src/
  app/                      Expo Router routes: thin files that mount feature screens
  di/                       Composition root: wires data implementations into use cases
  features/<feature>/
    domain/                 Entities, ports, use cases (plain TypeScript)
    data/                   Port implementations (Expo/native modules, storage, HTTP)
    presentation/           Screens, components, hooks, stores
  shared/<layer>/           Code shared by several features, same layer rules
```

Tests sit in `__tests__/` folders next to the code they cover.

## EAS build profiles

| Profile | Channel | Distribution | Use |
| --- | --- | --- | --- |
| development | development | internal (APK on Android) | Day-to-day dev build with the dev client |
| preview | preview | internal (APK on Android) | Testers, OTA demo |
| production | production | store | Store builds, auto-incremented build numbers |

`runtimeVersion` uses the `fingerprint` policy, so an OTA update only reaches builds with the same native code.
