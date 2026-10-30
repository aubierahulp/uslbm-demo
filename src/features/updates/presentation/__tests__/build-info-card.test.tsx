import { render, screen } from '@testing-library/react-native';

import { getBuildInfo } from '@/di';
import { BuildInfoCard } from '@/features/updates/presentation/build-info-card';

jest.mock('@/di', () => ({ getBuildInfo: jest.fn() }));
const mockGetBuildInfo = getBuildInfo as jest.Mock;

describe('BuildInfoCard', () => {
  it('shows the build info', async () => {
    mockGetBuildInfo.mockReturnValue({ appVersion: '1.0.0', runtimeVersion: 'abc123', channel: 'preview', updateId: 'update-1' });
    await render(<BuildInfoCard />);

    expect(screen.getByText('abc123')).toBeOnTheScreen();
    expect(screen.getByText('preview')).toBeOnTheScreen();
    expect(screen.getByText('update-1')).toBeOnTheScreen();
  });

  it('shows placeholders when running the embedded bundle in a dev build', async () => {
    mockGetBuildInfo.mockReturnValue({ appVersion: '1.0.0', runtimeVersion: null, channel: null, updateId: null });
    await render(<BuildInfoCard />);

    expect(screen.getByText('embedded')).toBeOnTheScreen();
    expect(screen.getAllByText('-')).toHaveLength(2);
  });
});
