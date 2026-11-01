import type { SQLiteDatabase } from 'expo-sqlite';
import type { Buffer } from 'react-native-quick-crypto';

import { openEncryptedDatabase } from '@/shared/data/database';
import { deriveFileKey, wipePlaintext } from '@/shared/data/file-cipher';
import { getOrCreateMasterKey } from '@/shared/data/master-key';
import { appError } from '@/shared/domain/app-error';
import type { DataVault } from '@/shared/domain/data-vault';

export type SqlcipherVault = DataVault & {
  getDatabase(): Promise<SQLiteDatabase>;
  /** AES-256 key for document files. Like the database, only available while the vault is open. */
  getFileKey(): Promise<Buffer>;
};

type Session = { db: SQLiteDatabase; fileKey: Buffer };

const locked = () => Promise.reject(appError('vault-locked', 'Unlock the app to see your data.'));

export function createSqlcipherVault(): SqlcipherVault {
  // A promise, so concurrent open() calls share one connection.
  let session: Promise<Session> | null = null;

  return {
    async open() {
      session ??= getOrCreateMasterKey().then(async (key) => ({
        db: await openEncryptedDatabase(key),
        fileKey: deriveFileKey(key),
      }));
      try {
        await session;
        // Plaintext left over from a killed app (a viewed document, an interrupted import) never outlives a lock.
        wipePlaintext();
      } catch (error) {
        session = null;
        throw error;
      }
    },
    async close() {
      const closing = session;
      session = null;
      wipePlaintext();
      const current = await closing;
      current?.fileKey.fill(0);
      await current?.db.closeAsync();
    },
    getDatabase() {
      return session ? session.then((s) => s.db) : locked();
    },
    getFileKey() {
      return session ? session.then((s) => s.fileKey) : locked();
    },
  };
}
