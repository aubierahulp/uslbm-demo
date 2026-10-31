import * as SecureStore from 'expo-secure-store';

import { secureSessionStore } from '@/features/auth/data/secure-session-store';
import type { Session } from '@/features/auth/domain/session';

jest.mock('expo-secure-store', () => {
  const items = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    getItemAsync: jest.fn(async (key: string) => items.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void items.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void items.delete(key)),
  };
});

const session: Session = {
  user: { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'emily@x.com' },
  accessToken: 'access',
  refreshToken: 'refresh',
};

describe('secureSessionStore', () => {
  beforeEach(() => secureSessionStore.clear());

  it('saves, loads and clears the session', async () => {
    await expect(secureSessionStore.load()).resolves.toBeNull();

    await secureSessionStore.save(session);
    await expect(secureSessionStore.load()).resolves.toEqual(session);

    await secureSessionStore.clear();
    await expect(secureSessionStore.load()).resolves.toBeNull();
  });

  it('stores tokens in the device keystore, not migrated to other devices', async () => {
    await secureSessionStore.save(session);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth.session', expect.any(String), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  });

  it('discards a corrupted session', async () => {
    await SecureStore.setItemAsync('auth.session', '{not json');

    await expect(secureSessionStore.load()).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.session', expect.anything());
  });
});
