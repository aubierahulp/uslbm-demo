import type { SessionStore } from '@/features/auth/domain/session-store';
import type { DataVault } from '@/shared/domain/data-vault';

/** Local records stay on the device, encrypted, for the next sign-in. */
export const makeLogout = (sessions: SessionStore, vault: DataVault) => async (): Promise<void> => {
  await vault.close();
  await sessions.clear();
};
