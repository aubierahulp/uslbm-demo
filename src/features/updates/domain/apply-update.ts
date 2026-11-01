import type { UpdateRepository } from '@/features/updates/domain/update-repository';

export const makeApplyUpdate = (updates: UpdateRepository) => (): Promise<void> => updates.restart();
