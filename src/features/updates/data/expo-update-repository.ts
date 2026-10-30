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
};
