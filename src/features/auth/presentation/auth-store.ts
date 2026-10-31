import { create } from 'zustand';

import { login, logout, restoreSession, unlock } from '@/di';
import type { User } from '@/features/auth/domain/session';

export type AuthStatus = 'restoring' | 'signed-out' | 'locked' | 'unlocked';

type AuthState = {
  status: AuthStatus;
  user: User | null;
  restore(): Promise<void>;
  login(username: string, password: string): Promise<void>;
  unlock(): Promise<void>;
  logout(): Promise<void>;
};

/** Actions rethrow domain errors so screens can show them. */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'restoring',
  user: null,
  async restore() {
    try {
      const user = await restoreSession();
      set({ user, status: user ? 'locked' : 'signed-out' });
    } catch (error) {
      set({ user: null, status: 'signed-out' });
      throw error;
    }
  },
  async login(username, password) {
    const user = await login(username, password);
    set({ user, status: 'unlocked' });
  },
  async unlock() {
    await unlock();
    set({ status: 'unlocked' });
  },
  async logout() {
    await logout();
    set({ user: null, status: 'signed-out' });
  },
}));
