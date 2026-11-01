# Field Vault

React Native (Expo SDK 58) demo app for the US LBM mobile work: an offline, encrypted document vault for field teams. The day-wise plan and daily updates are in [docs/day-wise-plan.md](docs/day-wise-plan.md).

What the app does:

- **Sign in** with DummyJSON. The session is kept in the Keychain/Keystore, and the app unlocks with biometrics or the device passcode.
- **Records**: create, edit and list inspection records with no network. They are stored in an encrypted SQLite database.
- **Documents**: import files from the device or download them over https, with progress, pause and resume. Every file is encrypted before it is stored, and opens in the system viewer.
- **Over-the-air updates**: the app checks for a new JavaScript update on launch and when it returns to the foreground, downloads it in the background, and offers a restart.

## Setup

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

The EAS project and the update URL are already set in `app.json`. Install the development build on a device or emulator, then run `npm start`.

Expo Go is not supported. SQLCipher, react-native-quick-crypto and expo-updates need a development build.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start Metro for the development build |
| `npm test` | Run unit tests (`test:watch` is also available) |
| `npm run test:coverage` | Unit tests with a coverage report in `coverage/` (`coverage/lcov-report/index.html`) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint, including the architecture rules |

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

Features: `auth`, `records`, `documents`, `updates`, `home`. Tests sit in `__tests__/` folders next to the code they cover.

Because of these rules, swapping a library touches one data file. For example, moving from DummyJSON to the real US LBM API means writing a new `AuthApi` implementation and changing one line in `src/di/index.ts`. Screens and use cases do not change.

## Encryption

### Keys

| Key | Where it lives | Used for |
| --- | --- | --- |
| Master key (256-bit, random from `expo-crypto`) | Keychain (iOS) / Keystore-backed SecureStore (Android), `WHEN_UNLOCKED_THIS_DEVICE_ONLY` | Database key (SQLCipher) |
| File key | Memory only, while the app is unlocked | Document files |

- The file key is derived from the master key with HKDF-SHA256 (`info = field-vault/files/v1`), so no key is used for two purposes.
- Both keys are released only after sign-in or unlock (biometrics or device passcode). On sign-out the database closes and the file key in memory is overwritten with zeros.
- `THIS_DEVICE_ONLY` keeps the master key out of iCloud and Android backups. A backup of the app's files cannot be decrypted on another device.

### Database: SQLCipher (full-database encryption)

The `expo-sqlite` config plugin builds SQLCipher into the app (`useSQLCipher: true`). Every page of the database file, including indexes and the schema, is encrypted with AES-256. The app refuses to open if SQLCipher is missing, so it can never fall back to plain SQLite.

**Full-database vs field-level encryption.** Field-level encryption encrypts selected columns in app code and leaves the rest of the file readable. That keeps search on the clear-text columns, but leaks metadata such as table names, row counts and which rows changed, and every query must remember to encrypt and decrypt. Full-database encryption protects everything with no changes to queries. The cost is roughly 5–15% more I/O, which is not noticeable at this app's data size. We chose full-database encryption.

### Documents: chunked AES-256-GCM

Spec sheets and PDFs can be 100 MB or more, and a JS engine cannot safely hold that in memory. Each file is therefore encrypted in 1 MiB chunks, streaming from file to file with `expo-file-system` file handles:

```
chunk = iv (12 bytes, random) | ciphertext | GCM tag (16 bytes)
AAD   = "<document id>:<chunk index>:<is last chunk>"
```

- **Authentication per chunk.** GCM over one long stream only checks the tag at the very end, after the reader has already seen unverified data. Here each chunk is checked before it is used.
- **Moving chunks fails.** The AAD ties each chunk to its document and position. Swapping files, reordering chunks, truncating the file or appending data all fail to decrypt.
- **Unique IVs.** Each chunk gets a fresh random IV. At 2^32 chunks per key (4 PiB) the collision risk would matter; this app is many orders of magnitude below that.
- **Integrity check.** A SHA-256 of the plaintext is stored in the database and checked again when a document is opened.

Code: [src/shared/data/file-cipher.ts](src/shared/data/file-cipher.ts). The unit tests run real AES-256-GCM (Node's crypto has the same API) and cover the round trip, wrong key, a changed byte, truncation, reordering, another document's id, and IV uniqueness.

**Native vs pure-JS crypto.** `react-native-quick-crypto` runs OpenSSL in native code through JSI, with no bridge serialisation. Pure-JS AES runs on the JS thread and blocks the UI for the whole file, and it is typically one to two orders of magnitude slower. It is fine for small strings but not for 100 MB files. We did not ship a pure-JS comparison, to avoid adding a dependency to the app.

### Benchmark (100 MB file)

Run it from **Documents → Benchmark 100 MB** on the device. It writes 100 MB of random data, then times the full file-to-file encryption and decryption, including disk I/O.

| Device | Build | Encrypt | Decrypt |
| --- | --- | --- | --- |
| _pending_ | preview (release) | _pending_ | _pending_ |

Measure on a preview or production build. Development builds run JS without optimisations and are slower.

## Threat model

**Protected**

| Threat | Protection |
| --- | --- |
| Lost or stolen phone, app locked | Data is encrypted. Keys need sign-in or the device unlock. |
| Someone copies the app's files (backup, `adb`, forensic copy without the keychain) | The database and documents are ciphertext. The master key never leaves the Keychain/Keystore and is excluded from backups. |
| Tampering with stored documents | AES-GCM authentication and the stored SHA-256 reject any change. |
| Leftover plaintext | Imports, downloads and viewed copies use one cache folder that is wiped on unlock and on sign-out. |
| Network eavesdropping on downloads | Only `https://` links are accepted. |

**Not protected (known limits)**

- **A compromised device** (rooted or jailbroken, or malware with the device unlocked). While the app is unlocked, keys are in memory. Root and jailbreak detection is a proposed follow-up.
- **The biometric prompt is an app-level gate.** The master key is not cryptographically bound to biometrics. Binding it is possible with `requireAuthentication`, but the key is then lost when the user changes their enrolled biometrics, so we would need a recovery path first.
- **Viewed documents.** While a document is open in the system viewer, a decrypted copy is in the app's cache, and the viewer app can read it.
- **Data after sign-out.** Records and documents stay encrypted on the device for the next sign-in. A full wipe on sign-out or account switch is a proposed follow-up.
- **Screenshots and screen recording** are not blocked.
- **Backend security** (DummyJSON stands in for a real API). Token refresh is not implemented, because the app makes no authenticated calls yet.

## OTA updates (EAS Update)

| Profile | Channel | Distribution | Use |
| --- | --- | --- | --- |
| development | development | internal (APK on Android) | Day-to-day dev build with the dev client |
| preview | preview | internal (APK on Android) | Testers, OTA demo |
| production | production | store | Store builds, auto-incremented build numbers |

`runtimeVersion` uses the `fingerprint` policy. The runtime version is a hash of the native project, so an update only reaches builds with the same native code. If a change adds a native module or a config plugin, the fingerprint changes and EAS will not send the update to older builds.

**In the app.** By default, expo-updates checks on cold start. Field users rarely cold-start, so the app also checks when it returns to the foreground. When an update has downloaded, Home shows **Update available → Restart**. The restart locks the app again, which is intended. The Build card on Home shows the channel, runtime version and running update ID.

**Publish and roll back**

```bash
# 1. Build once and install it (internal distribution gives an install link / QR code)
npx eas-cli@latest build --profile preview --platform android

# 2. Ship a JS-only change to that build
npx eas-cli@latest update --channel preview --message "Change welcome text"

# 3. Undo it: republishes the previous update, or rolls back to the build's embedded bundle
npx eas-cli@latest update:rollback
```

Devices pick up a rollback the same way they pick up an update: on their next check.

**What OTA cannot do**

- **Change native code.** That includes new native modules, permissions, `app.json` native settings (icons, splash, plugins) and Expo SDK upgrades. These need a new build through the stores, and the fingerprint keeps such updates away from old binaries.
- **Reach users instantly.** Devices get an update only after the app checks, which needs network, and apply it only after a restart or the next launch. Some users stay on an older version for a while, so the backend must support more than one app version.
- **Change what the app is for.** App Store and Play policies allow interpreted-code updates for fixes and improvements, not for changing the app's main purpose or adding features that need store review.
- **Secure the update channel by itself.** Updates are downloaded over HTTPS from Expo's servers. End-to-end code signing (expo-updates checks a signature made with our private key) is available but not set up in this demo. We recommend enabling it before production, because OTA is a code-delivery channel.

## Testing

Unit tests cover every domain, data and presentation module, following the strategy in [docs/clean-architecture.md §6](docs/clean-architecture.md#6-testing-by-layer):

- **Domain**: use cases with fake ports.
- **Data**: native modules mocked with `jest.mock`. The cipher runs real AES-GCM.
- **Presentation**: React Native Testing Library, with `@/di` mocked.

`npm run test:coverage` writes the report to `coverage/`. Files at 0% are type-only (ports, entities), one-line route re-exports, or the `src/di` composition root, which has no logic.
