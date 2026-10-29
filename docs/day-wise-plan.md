# React Native (Expo) Demo App: Day-wise Plan (Rahul)

As of 27 Oct 2026 · Rahul

## Overview

By Friday (30 Oct) EOD I will demo a working Expo app that covers all six critical technical requirements for US LBM.

**App concept:** an offline field document vault. The user logs in, downloads or imports large documents such as spec sheets and PDFs, and creates records with no network. Everything is encrypted on the device, and JS changes ship over the air.

**Requirements covered:** OTA updates, offline storage of large documents and app data, encryption of offline storage, EAS cloud deployment, unit tests for all modules, and Expo fundamentals (authentication layer, centralised theming, sound architecture).

**Two scope decisions that make the timeline fit:**

- **All native modules are installed on Day 1.** One development build then covers the whole week. Each native change added later needs a new EAS build, which takes 15–30 minutes.
- **No custom backend.** DummyJSON's `/auth/login` provides real tokens, and a public large file URL is used for downloads.

## Day-wise plan

I'll update the last column at the end of each day.

| Day | Feature I'll work on | What it helps me learn | Updates for the day |
| --- | --- | --- | --- |
| Tue 27 Oct (Day 1, after 1 PM) | Project setup with `create-expo-app` (TypeScript, Expo Router). Feature-based folder structure: `app/`, `features/`, `services/`, `theme/`. Centralised theme file with color, spacing and typography tokens, light and dark mode, and a `useTheme` hook. All native modules installed and `expo-updates` configured. `eas init`, `eas.json` with development, preview and production profiles, and the first dev build started. Jest with `jest-expo` and React Native Testing Library, with one passing test. | Expo project structure and Expo Router (file-based routing, layouts). Expo Go vs development builds. EAS Build basics. React components, props and hooks. Jest setup in Expo. | |
| Wed 28 Oct (Day 2) | Auth layer: login screen, DummyJSON auth, access and refresh tokens stored in `expo-secure-store`, an auth store (Zustand or Context), protected routes through layout redirects, and logout. Biometric app unlock with `expo-local-authentication`. Offline app data: `expo-sqlite` with migrations, a repository layer, and create, edit and list screens that work fully offline. Tests for the auth store, token handling and the repository. | `useState`, `useEffect`, Context and Zustand. Route guards in Expo Router. Keychain and Keystore through SecureStore. SQLite in React Native. Mocking native modules in Jest. | |
| Thu 29 Oct (Day 3) | Large document storage: resumable downloads with progress through `expo-file-system`, and imports through `expo-document-picker`. Files go in the document directory; path, size, hash and mime type go in SQLite. Encryption: a master key generated on first launch, stored in SecureStore and released only after biometric unlock. Files use AES-256-GCM with `react-native-quick-crypto`, in chunks so a 100 MB+ file never loads fully into memory. The database uses SQLCipher through the `expo-sqlite` config plugin. Encrypt and decrypt benchmarks on a 100 MB file. Tests: round trip, wrong key fails, tampered data fails, unique IVs. | File system APIs and JS memory limits. AES-GCM, IVs and key management. Config plugins. Full-database vs field-level encryption trade-offs. Native-backed vs pure-JS crypto performance. | |
| Fri 30 Oct (Day 4, demo EOD) | OTA updates: EAS Update channels (preview, production), a runtimeVersion policy, and an in-app "Update available, restart" banner using `useUpdates`. Demo of publishing a JS-only change and rolling it back. EAS deployment: a preview build shared through internal distribution (Android APK; iOS if the Apple account is available). Unit tests completed for every module, with a coverage report. README covering the architecture, encryption research with benchmark numbers, the threat model, and what OTA cannot do. | EAS Update, channels, branches and rollback. Runtime version compatibility. EAS Build and internal distribution. Testing strategy. Documenting technical decisions. | |

## Stretch goals

These are only if I'm ahead of schedule:

- [ ] Offline sync queue: records marked "pending" or "synced" against a mock API
- [ ] An EAS Workflow that runs tests, then builds, then publishes an update

## Additional critical points proposed

I suggest adding these to the demo scope:

1. **Offline sync and conflict handling:** with offline-first data, we need to decide what happens when two edits conflict.
2. **EAS Update code signing:** OTA updates are a code-delivery channel, and the client may ask how they are secured.
3. **Data wipe on logout or account switch:** deleting the encryption key and the stored files.
4. **Environment config:** separate dev, staging and prod settings and secrets through EAS environment variables.
5. **Crash and error monitoring:** for example Sentry, which is hard to add cleanly late in a project.
6. **Root and jailbreak detection, and screenshot blocking:** only if US LBM's data is sensitive enough.

## Risks and fallbacks

| Risk | Fallback |
| --- | --- |
| No Apple Developer account for iOS device builds | Demo iOS on the simulator, and the Android APK on a device |
| Chunked AES-GCM on a single large file gets stuck | Encrypt each chunk separately with its own IV, and record the trade-off in the research section |
| EAS cloud build queue is slow | Start builds early in the day and build locally with `eas build --local` if needed |
