import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/features/auth/domain/session';
import type { SessionStore } from '@/features/auth/domain/session-store';

const STORE_KEY = 'auth.session';
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const secureSessionStore: SessionStore = {
  async load() {
    const value = await SecureStore.getItemAsync(STORE_KEY, OPTIONS);
    if (!value) return null;
    try {
      return JSON.parse(value) as Session;
    } catch {
      await SecureStore.deleteItemAsync(STORE_KEY, OPTIONS);
      return null;
    }
  },
  save: (session) => SecureStore.setItemAsync(STORE_KEY, JSON.stringify(session), OPTIONS),
  clear: () => SecureStore.deleteItemAsync(STORE_KEY, OPTIONS),
};
