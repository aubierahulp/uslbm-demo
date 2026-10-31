import type { AuthApi } from '@/features/auth/domain/auth-api';
import type { User } from '@/features/auth/domain/session';
import type { SessionStore } from '@/features/auth/domain/session-store';
import { appError } from '@/shared/domain/app-error';
import type { DataVault } from '@/shared/domain/data-vault';

export const makeLogin =
  (api: AuthApi, sessions: SessionStore, vault: DataVault) =>
  async (username: string, password: string): Promise<User> => {
    const name = username.trim();
    if (!name || !password) throw appError('validation', 'Enter your username and password.');

    const session = await api.login(name, password);
    await sessions.save(session);
    await vault.open();
    return session.user;
  };
