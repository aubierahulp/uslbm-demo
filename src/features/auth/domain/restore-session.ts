import type { User } from '@/features/auth/domain/session';
import type { SessionStore } from '@/features/auth/domain/session-store';

/** Works offline: a stored session is enough to reach the unlock step. */
// ponytail: tokens are not refreshed; add refresh when the app makes authenticated API calls after login.
export const makeRestoreSession =
  (sessions: SessionStore) =>
  async (): Promise<User | null> =>
    (await sessions.load())?.user ?? null;
