import type { BuildInfo } from '@/features/updates/domain/build-info';

export interface UpdateRepository {
  getBuildInfo(): BuildInfo;
}
