import * as Updates from 'expo-updates';

import { expoUpdateRepository } from '@/features/updates/data/expo-update-repository';

jest.mock('expo-constants', () => ({ expoConfig: { version: '1.2.3' } }));
jest.mock('expo-updates', () => ({
  runtimeVersion: 'rt-1',
  channel: 'preview',
  isEmbeddedLaunch: false,
  isEnabled: true,
  updateId: 'update-1',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));
const mockUpdates = Updates as { isEmbeddedLaunch: boolean; isEnabled: boolean };
const check = Updates.checkForUpdateAsync as jest.Mock;
const fetch = Updates.fetchUpdateAsync as jest.Mock;
const setDev = (value: boolean) => Object.assign(globalThis, { __DEV__: value });

describe('expoUpdateRepository', () => {
  const dev = __DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdates.isEnabled = true;
    setDev(false);
  });
  afterAll(() => {
    setDev(dev);
  });

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

  it.each([
    [{ isAvailable: true, isRollBackToEmbedded: false }, true],
    [{ isAvailable: false, isRollBackToEmbedded: true }, true],
    [{ isAvailable: false, isRollBackToEmbedded: false }, false],
  ])('treats check result %o as available: %p', async (result, expected) => {
    check.mockResolvedValue(result);
    await expect(expoUpdateRepository.check()).resolves.toBe(expected);
  });

  it('does not call the server when updates are disabled or in development', async () => {
    mockUpdates.isEnabled = false;
    await expect(expoUpdateRepository.check()).resolves.toBe(false);

    mockUpdates.isEnabled = true;
    setDev(true);
    await expect(expoUpdateRepository.check()).resolves.toBe(false);

    expect(check).not.toHaveBeenCalled();
  });

  it.each([
    [{ isNew: true, isRollBackToEmbedded: false }, true],
    [{ isNew: false, isRollBackToEmbedded: true }, true],
    [{ isNew: false, isRollBackToEmbedded: false }, false],
  ])('treats fetch result %o as ready: %p', async (result, expected) => {
    fetch.mockResolvedValue(result);
    await expect(expoUpdateRepository.download()).resolves.toBe(expected);
  });

  it('restarts through expo-updates', async () => {
    await expoUpdateRepository.restart();
    expect(Updates.reloadAsync).toHaveBeenCalled();
  });
});
