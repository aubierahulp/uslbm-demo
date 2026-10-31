import * as SQLite from 'expo-sqlite';

import { openEncryptedDatabase } from '@/shared/data/database';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const KEY = 'ab'.repeat(32);

function fakeDb({ cipherVersion = '4.6.1' as string | null, userVersion = 0 } = {}) {
  return {
    execAsync: jest.fn(),
    getFirstAsync: jest.fn(async (sql: string) => {
      if (sql === 'PRAGMA cipher_version') return cipherVersion ? { cipher_version: cipherVersion } : null;
      if (sql === 'PRAGMA user_version') return { user_version: userVersion };
      return null;
    }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
    closeAsync: jest.fn(),
  };
}

describe('openEncryptedDatabase', () => {
  it('sets the raw key before anything else and runs pending migrations', async () => {
    const db = fakeDb();
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(db);

    await expect(openEncryptedDatabase(KEY)).resolves.toBe(db);

    expect(db.execAsync.mock.calls[0][0]).toBe(`PRAGMA key = "x'${KEY}'";`);
    expect(db.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE records'));
    expect(db.execAsync).toHaveBeenCalledWith('PRAGMA user_version = 1');
  });

  it('skips migrations that already ran', async () => {
    const db = fakeDb({ userVersion: 1 });
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(db);

    await openEncryptedDatabase(KEY);

    expect(db.withTransactionAsync).not.toHaveBeenCalled();
  });

  it('refuses to continue without SQLCipher and closes the database', async () => {
    const db = fakeDb({ cipherVersion: null });
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(db);

    await expect(openEncryptedDatabase(KEY)).rejects.toThrow('SQLCipher is not available');
    expect(db.closeAsync).toHaveBeenCalled();
  });

  it('rejects a key that is not 64 hex characters', async () => {
    await expect(openEncryptedDatabase(`'; DROP TABLE records; --`)).rejects.toThrow('Invalid database key.');
  });
});
