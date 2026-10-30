import { Text, type TextProps } from 'react-native';

import { Typography, type ThemeColor, type TypographyVariant } from '@/shared/presentation/theme';
import { useTheme } from '@/shared/presentation/theme/use-theme';

export type ThemedTextProps = TextProps & {
  type?: TypographyVariant;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor = 'text', ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor] }, Typography[type], style]} {...rest} />;
}
