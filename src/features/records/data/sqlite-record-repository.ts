import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { FieldRecord, RecordStatus } from '@/features/records/domain/field-record';
import type { RecordRepository } from '@/features/records/domain/record-repository';
import { appError } from '@/shared/domain/app-error';

type RecordRow = {
  id: string;
  title: string;
  notes: string;
  status: RecordStatus;
  created_at: number;
  updated_at: number;
};

const toRecord = (row: RecordRow): FieldRecord => ({
  id: row.id,
  title: row.title,
  notes: row.notes,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function createSqliteRecordRepository(getDb: () => Promise<SQLiteDatabase>): RecordRepository {
  const get = async (id: string) => {
    const row = await (await getDb()).getFirstAsync<RecordRow>('SELECT * FROM records WHERE id = ?', id);
    return row ? toRecord(row) : null;
  };

  return {
    async list() {
      const rows = await (await getDb()).getAllAsync<RecordRow>('SELECT * FROM records ORDER BY updated_at DESC');
      return rows.map(toRecord);
    },
    get,
    async create({ title, notes, status }) {
      const now = Date.now();
      const record: FieldRecord = { id: Crypto.randomUUID(), title, notes, status, createdAt: now, updatedAt: now };
      await (await getDb()).runAsync(
        'INSERT INTO records (id, title, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        record.id,
        title,
        notes,
        status,
        now,
        now
      );
      return record;
    },
    async update(id, { title, notes, status }) {
      const { changes } = await (await getDb()).runAsync(
        'UPDATE records SET title = ?, notes = ?, status = ?, updated_at = ? WHERE id = ?',
        title,
        notes,
        status,
        Date.now(),
        id
      );
      if (changes === 0) throw appError('not-found', 'This record no longer exists.');
      return (await get(id))!;
    },
  };
}
