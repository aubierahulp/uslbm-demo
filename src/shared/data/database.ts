import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'field-vault.db';

/** Append-only. Index + 1 is the schema version stored in PRAGMA user_version. */
const MIGRATIONS = [
  `CREATE TABLE records (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'done')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  // The encrypted file lives at documents/vault/<id>.bin; its path is derived, because iOS moves the app container.
  `CREATE TABLE documents (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );`,
];

/** Opens the SQLCipher database with a raw 256-bit hex key and brings the schema up to date. */
export async function openEncryptedDatabase(hexKey: string): Promise<SQLite.SQLiteDatabase> {
  if (!/^[0-9a-f]{64}$/.test(hexKey)) throw new Error('Invalid database key.');

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  try {
    await db.execAsync(`PRAGMA key = "x'${hexKey}'";`);
    // Without SQLCipher in the binary, PRAGMA key is silently ignored and data would be stored in plain text.
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cipher) throw new Error('SQLCipher is not available. Refusing to store data unencrypted.');
    await migrate(db);
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let version = row?.user_version ?? 0; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
