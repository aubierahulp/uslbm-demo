import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { getOrCreateMasterKey } from '@/shared/data/master-key';

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn() }));

const getItem = SecureStore.getItemAsync as jest.Mock;
const setItem = SecureStore.setItemAsync as jest.Mock;
const randomBytes = Crypto.getRandomBytesAsync as jest.Mock;

describe('getOrCreateMasterKey', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the stored key without generating a new one', async () => {
    getItem.mockResolvedValue('a'.repeat(64));

    await expect(getOrCreateMasterKey()).resolves.toBe('a'.repeat(64));
    expect(randomBytes).not.toHaveBeenCalled();
  });

  it('generates a 256-bit key and stores it on this device only', async () => {
    getItem.mockResolvedValue(null);
    randomBytes.mockResolvedValue(new Uint8Array(32).fill(0xab));

    const key = await getOrCreateMasterKey();

    expect(randomBytes).toHaveBeenCalledWith(32);
    expect(key).toBe('ab'.repeat(32));
    expect(setItem).toHaveBeenCalledWith('vault.master-key', key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  });
});
