import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const STORE_KEY = 'vault.master-key';
// Not migrated to other devices through backups.
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

/** 256-bit key as 64 hex characters, generated on first use and kept in Keychain/Keystore. */
export async function getOrCreateMasterKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(STORE_KEY, OPTIONS);
  if (existing) return existing;

  // The async variant is always cryptographically secure; the sync one falls back to Math.random in dev.
  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(STORE_KEY, key, OPTIONS);
  return key;
}
