import type { BuildInfo } from '@/features/updates/domain/build-info';

export interface UpdateRepository {
  getBuildInfo(): BuildInfo;
  /** True when the server has a newer update for this runtime, or a rollback directive. False when updates are disabled. */
  check(): Promise<boolean>;
  /** Downloads it for the next launch. True when something new was stored. */
  download(): Promise<boolean>;
  /** Restarts the JS app on the downloaded update. */
  restart(): Promise<void>;
}
