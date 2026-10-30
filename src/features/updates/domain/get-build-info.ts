import type { BuildInfo } from '@/features/updates/domain/build-info';
import type { UpdateRepository } from '@/features/updates/domain/update-repository';

export const makeGetBuildInfo = (updates: UpdateRepository) => (): BuildInfo =>
  updates.getBuildInfo();
