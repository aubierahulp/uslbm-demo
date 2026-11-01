import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import type { UpdateRepository } from '@/features/updates/domain/update-repository';

export const expoUpdateRepository: UpdateRepository = {
  getBuildInfo: () => ({
    appVersion: Constants.expoConfig?.version ?? null,
    runtimeVersion: Updates.runtimeVersion,
    channel: Updates.channel,
    updateId: Updates.isEmbeddedLaunch ? null : Updates.updateId,
  }),
  async check() {
    // The update API rejects in development, where Metro serves the JS.
    if (!Updates.isEnabled || __DEV__) return false;
    const result = await Updates.checkForUpdateAsync();
    // A rollback (`eas update:rollback` to the embedded build) reports isAvailable: false but still has to be applied.
    return result.isAvailable || result.isRollBackToEmbedded;
  },
  async download() {
    const result = await Updates.fetchUpdateAsync();
    return result.isNew || result.isRollBackToEmbedded;
  },
  restart: () => Updates.reloadAsync(),
};
