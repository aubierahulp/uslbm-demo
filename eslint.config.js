// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Clean Architecture import rules. Source of truth: docs/clean-architecture.md
const DEVICE_MODULES =
  '^(expo-(sqlite|secure-store|file-system|updates|constants|crypto|local-authentication|document-picker)|react-native-quick-crypto)(/|$)';

const rule = (regex, message) => ({ regex, message });
const PARENT_RELATIVE = rule('^\\.\\./', 'Use the @/ alias instead of ../ imports.');
const TO_DATA = rule('/data(/|$)', 'Only src/di may import a data/ layer.');
const TO_DOMAIN = rule('/domain(/|$)', 'Routes must not import domain/. Mount a presentation screen.');
const TO_PRESENTATION = rule('/presentation(/|$)', 'Inner layers must not depend on presentation/.');
const TO_DI = rule('^@/di(/|$)', 'Only presentation may use @/di.');
const TO_APP = rule('^@/app(/|$)', 'Nothing imports from routes.');
const TO_DEVICE = rule(DEVICE_MODULES, 'Device and storage modules belong in the data layer.');
const TO_REACT = rule('^(react|zustand)(/|$)', 'React and UI state belong in presentation.');

const restrict = (files, ...patterns) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns: [PARENT_RELATIVE, ...patterns] }] },
});

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*'],
  },
  restrict(['src/**/*.{ts,tsx}']),
  restrict(
    ['src/**/domain/**/*.{ts,tsx}'],
    TO_DATA,
    TO_PRESENTATION,
    TO_DI,
    TO_APP,
    TO_REACT,
    rule('^(react-native|expo|@expo/|expo-|react-native-|@react-native)', 'Domain is plain TypeScript.')
  ),
  restrict(['src/**/data/**/*.{ts,tsx}'], TO_PRESENTATION, TO_DI, TO_APP, TO_REACT),
  restrict(['src/**/presentation/**/*.{ts,tsx}'], TO_DATA, TO_APP, TO_DEVICE),
  restrict(['src/app/**/*.{ts,tsx}'], TO_DATA, TO_DOMAIN, TO_DI, TO_DEVICE),
]);
