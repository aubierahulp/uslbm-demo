import * as Updates from 'expo-updates';

import { expoUpdateRepository } from '@/features/updates/data/expo-update-repository';

jest.mock('expo-constants', () => ({ expoConfig: { version: '1.2.3' } }));
jest.mock('expo-updates', () => ({
  runtimeVersion: 'rt-1',
  channel: 'preview',
  isEmbeddedLaunch: false,
  updateId: 'update-1',
}));
const mockUpdates = Updates as { isEmbeddedLaunch: boolean };

describe('expoUpdateRepository', () => {
  it('maps the running OTA update to build info', () => {
    mockUpdates.isEmbeddedLaunch = false;
    expect(expoUpdateRepository.getBuildInfo()).toEqual({
      appVersion: '1.2.3',
      runtimeVersion: 'rt-1',
      channel: 'preview',
      updateId: 'update-1',
    });
  });

  it('reports no update id when running the embedded bundle', () => {
    mockUpdates.isEmbeddedLaunch = true;
    expect(expoUpdateRepository.getBuildInfo().updateId).toBeNull();
  });
});
