import type { BuildInfo } from '@/features/updates/domain/build-info';
import { makeGetBuildInfo } from '@/features/updates/domain/get-build-info';

describe('getBuildInfo', () => {
  it('returns the build info from the repository', () => {
    const info: BuildInfo = { appVersion: '1.0.0', runtimeVersion: 'rt', channel: 'preview', updateId: 'u1' };
    const getBuildInfo = makeGetBuildInfo({ getBuildInfo: () => info, check: jest.fn(), download: jest.fn(), restart: jest.fn() });

    expect(getBuildInfo()).toEqual(info);
  });
});
