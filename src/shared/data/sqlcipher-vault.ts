import type { SQLiteDatabase } from 'expo-sqlite';

import { openEncryptedDatabase } from '@/shared/data/database';
import { getOrCreateMasterKey } from '@/shared/data/master-key';
import { appError } from '@/shared/domain/app-error';
import type { DataVault } from '@/shared/domain/data-vault';

export type SqlcipherVault = DataVault & { getDatabase(): Promise<SQLiteDatabase> };

export function createSqlcipherVault(): SqlcipherVault {
  // A promise, so concurrent open() calls share one connection.
  let database: Promise<SQLiteDatabase> | null = null;

  return {
    async open() {
      database ??= getOrCreateMasterKey().then(openEncryptedDatabase);
      try {
        await database;
      } catch (error) {
        database = null;
        throw error;
      }
    },
    async close() {
      const closing = database;
      database = null;
      await (await closing)?.closeAsync();
    },
    getDatabase() {
      if (!database) return Promise.reject(appError('vault-locked', 'Unlock the app to see your data.'));
      return database;
    },
  };
}
