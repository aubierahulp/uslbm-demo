import { renderHook } from '@testing-library/react-native';

import { Colors } from '@/shared/presentation/theme';
import { useColorScheme } from '@/shared/presentation/theme/use-color-scheme';
import { useTheme } from '@/shared/presentation/theme/use-theme';

jest.mock('@/shared/presentation/theme/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

const scheme = useColorScheme as jest.Mock;

describe('useTheme', () => {
  it.each([
    ['dark', Colors.dark],
    ['light', Colors.light],
    [null, Colors.light],
  ])('returns the %p palette', async (value, expected) => {
    scheme.mockReturnValue(value);
    const { result } = await renderHook(() => useTheme());

    expect(result.current).toBe(expected);
  });
});
