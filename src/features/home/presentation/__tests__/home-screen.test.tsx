import { render, screen } from '@testing-library/react-native';

import { HomeScreen } from '@/features/home/presentation/home-screen';

jest.mock('@/di', () => ({
  getBuildInfo: () => ({ appVersion: '1.0.0', runtimeVersion: 'rt', channel: 'preview', updateId: null }),
}));

describe('HomeScreen', () => {
  it('renders the title and build info', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Field Vault')).toBeOnTheScreen();
    expect(screen.getByText('Build')).toBeOnTheScreen();
  });
});
