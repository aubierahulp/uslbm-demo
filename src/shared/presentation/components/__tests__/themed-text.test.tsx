import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/shared/presentation/components/themed-text';
import { useColorScheme } from '@/shared/presentation/theme/use-color-scheme';
import { Colors, Typography } from '@/shared/presentation/theme';

jest.mock('@/shared/presentation/theme/use-color-scheme', () => ({ useColorScheme: jest.fn() }));
const mockScheme = useColorScheme as jest.Mock;

describe('ThemedText', () => {
  it.each(['light', 'dark'] as const)('uses the %s palette', async (scheme) => {
    mockScheme.mockReturnValue(scheme);
    await render(<ThemedText>Hello</ThemedText>);
    expect(screen.getByText('Hello')).toHaveStyle({ color: Colors[scheme].text });
  });

  it('applies the typography variant and theme color', async () => {
    mockScheme.mockReturnValue('light');
    await render(
      <ThemedText type="title" themeColor="danger">
        Error
      </ThemedText>
    );
    expect(screen.getByText('Error')).toHaveStyle({
      color: Colors.light.danger,
      fontSize: Typography.title.fontSize,
    });
  });
});
