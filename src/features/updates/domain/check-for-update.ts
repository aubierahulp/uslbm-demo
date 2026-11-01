import type { UpdateRepository } from '@/features/updates/domain/update-repository';

/** Downloads a newer update in the background. Resolves true once a restart will apply it. */
export const makeCheckForUpdate = (updates: UpdateRepository) => async (): Promise<boolean> =>
  (await updates.check()) && updates.download();
