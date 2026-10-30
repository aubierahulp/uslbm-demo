/**
 * Centralised design tokens. Screens and components read colors through `useTheme()`
 * and import the static tokens (spacing, radius, typography) from here.
 * Learn more about light and dark modes: https://docs.expo.dev/guides/color-schemes/
 */

import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#60646C',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    border: '#D9D9E0',
    primary: '#208AEF',
    onPrimary: '#ffffff',
    success: '#18794E',
    danger: '#CE2C31',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#B0B4BA',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    border: '#3A3F42',
    primary: '#3C9EFF',
    onPrimary: '#ffffff',
    success: '#3DD68C',
    danger: '#FF6369',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = { [K in ThemeColor]: string };

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 24,
  pill: 999,
} as const;

export const Typography = {
  title: { fontSize: 32, lineHeight: 40, fontWeight: 700 },
  subtitle: { fontSize: 20, lineHeight: 28, fontWeight: 600 },
  default: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
  defaultBold: { fontSize: 16, lineHeight: 24, fontWeight: 600 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: 700 },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: Platform.select({ android: 700, default: 500 }),
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

export const MaxContentWidth = 800;
