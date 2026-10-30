# Clean Architecture Rules

**Status: mandatory.** Every change to `src/` must follow these rules. Code that breaks them is not merged. ESLint enforces the import rules (see [Enforcement](#7-enforcement)), and disabling those lint rules is not allowed.

## 1. The dependency rule

Dependencies point inward only:

```
presentation  ──►  domain  ◄──  data
      ▲                          ▲
      └────────  di (composition root) ─┘
```

- **domain** is the centre. It knows nothing about React, React Native, Expo, storage, network or UI.
- **data** implements the interfaces (ports) that domain declares.
- **presentation** renders UI and calls domain use cases. It never touches data.
- **di** is the only place where data implementations are wired into use cases.
- **app** (Expo Router routes) is the outermost shell. It only mounts presentation.

## 2. Folder structure

```
src/
  app/                          Expo Router routes only: thin files that mount screens
  di/                           Composition root: builds repositories and use cases
  features/
    <feature>/
      domain/                   Entities, ports (repository interfaces), use cases, domain errors
      data/                     Port implementations, data sources, DTOs and mappers
      presentation/             Screens, components, hooks, stores (zustand)
  shared/
    domain/                     Domain types used by several features (e.g. Result, AppError)
    data/                       Infrastructure clients used by several features (db, crypto, http)
    presentation/               Theme, themed components, shared hooks
```

A feature only has the layers it needs. Create a layer folder when the first file for it is written, never ahead of time.

Tests live in a `__tests__/` folder next to the code they cover, inside the same layer. Never put tests under `src/app/`, because every file there becomes a route.

## 3. Layer rules

### domain

- MUST be plain TypeScript.
- MUST NOT import `react`, `react-native`, `zustand`, any `expo*` / `@expo/*` package, or any `react-native-*` package.
- MUST NOT import from any `data/` or `presentation/` folder, `@/di` or `@/app`.
- MAY import from its own feature's `domain/`, another feature's `domain/`, and `shared/domain/`.
- Contains:
  - **Entities:** plain types describing business data (`Record`, `BuildInfo`).
  - **Ports:** interfaces the domain needs from the outside world (`RecordRepository`, `KeyStore`).
  - **Use cases:** one file per use case, a factory that takes its ports and returns a function:
    ```ts
    export const makeGetBuildInfo = (updates: UpdateRepository) => (): BuildInfo =>
      updates.getBuildInfo();
    ```
  - **Domain errors:** typed errors that data maps library errors into.

### data

- MUST implement a domain port. Each implementation is a factory or object typed as that port.
- MUST map library and storage types (SQLite rows, Expo objects, HTTP DTOs) to domain entities before returning them. Library types never leave data.
- MUST NOT import `react`, `zustand`, any `presentation/` folder, `@/di` or `@/app`.
- Is the only layer that may import device and storage modules: `expo-sqlite`, `expo-secure-store`, `expo-file-system`, `expo-updates`, `expo-constants`, `expo-crypto`, `expo-local-authentication`, `expo-document-picker`, `react-native-quick-crypto`, and HTTP clients.

### presentation

- MUST get behaviour only from use cases exported by `@/di`.
- MUST NOT import any `data/` folder or the device and storage modules listed above.
- MUST NOT contain business rules. Formatting values for display is fine; deciding what is valid or allowed belongs in domain.
- MAY import domain types (entities, errors) for typing.
- UI state lives here: component state, hooks, zustand stores.
- Styling MUST use tokens from `@/shared/presentation/theme`. No hard-coded colors, spacing or font sizes in screens.

### di (composition root)

- `src/di/index.ts` creates every data implementation and passes it into the use cases, then exports the wired use cases.
- It is the only module allowed to import from both `data/` and `domain/` to wire them.
- It contains no logic beyond construction.

### app (routes)

- Route files only mount a screen from a feature's `presentation/`: `export { HomeScreen as default } from '@/features/home/presentation/home-screen';`
- `_layout.tsx` files may set up navigators, providers and route guards using presentation code.
- MUST NOT import `domain/`, `data/`, `@/di` or device and storage modules.

## 4. Cross-feature rules

- A feature MAY depend on another feature's `domain/` (from its own domain or presentation) and, from its own presentation, on another feature's `presentation/`.
- A feature MUST NOT import another feature's `data/`.
- Code needed by three or more features moves to `shared/<layer>/`.

## 5. Imports and naming

- Imports that leave the current folder use the `@/` alias. Parent-relative imports (`../`) are not allowed.
- File names are kebab-case: `build-info.ts`, `expo-update-repository.ts`.
- Ports are named after what they provide: `UpdateRepository`, `KeyStore`.
- Implementations are named after their technology: `expoUpdateRepository`, `createSqliteRecordRepository(db)`.
- Use case factories are `make<Verb><Noun>` (`makeGetBuildInfo`). The wired use case exported from `@/di` is `<verb><Noun>` (`getBuildInfo`).
- No classes unless a library requires one. Prefer plain functions, factories and object literals.

## 6. Testing by layer

| Layer | What to test | How |
| --- | --- | --- |
| domain | Every use case and every entity rule | Fake ports written in the test; no mocks of libraries |
| data | Mapping, error mapping, storage behaviour | `jest.mock` the Expo or native module |
| presentation | Rendering, user interaction, loading and error states | React Native Testing Library; `jest.mock('@/di')` to stub use cases |

Every new domain, data or presentation module ships with its test in the same change.

## 7. Enforcement

- `eslint.config.js` encodes the import rules in this document with `no-restricted-imports`, per layer. `npm run lint` fails on any violation.
- `eslint-disable` comments for `no-restricted-imports` are not allowed. If a rule seems to block valid work, change this document and the lint config together, in their own change.
- Done means `npm run lint`, `npm run typecheck` and `npm test` all pass.

## 8. Adding a feature (checklist)

1. Domain: entities, ports, and use cases, each with tests that use fake ports.
2. Data: port implementations with mapping, plus tests with mocked modules.
3. di: wire the implementations into the use cases in `src/di/index.ts`.
4. Presentation: screens and components calling `@/di`, plus tests with `@/di` mocked.
5. app: add a thin route file that mounts the screen.
6. Run lint, typecheck and tests.
