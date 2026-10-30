import { useColorScheme } from '@/shared/presentation/theme/use-color-scheme';

import { Colors, type ThemeColors } from '@/shared/presentation/theme';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
