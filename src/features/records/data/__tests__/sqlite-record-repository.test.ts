import type { SQLiteDatabase } from 'expo-sqlite';

import { createSqliteRecordRepository } from '@/features/records/data/sqlite-record-repository';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid-1' }));

const row = {
  id: 'r1',
  title: 'Roof inspection',
  notes: 'North side',
  status: 'in_progress',
  created_at: 100,
  updated_at: 200,
};

function setup() {
  const db = {
    getAllAsync: jest.fn(async () => [row]),
    getFirstAsync: jest.fn(async (_sql: string, id: string) => (id === row.id ? row : null)),
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
  };
  const repo = createSqliteRecordRepository(async () => db as unknown as SQLiteDatabase);
  return { db, repo };
}

describe('createSqliteRecordRepository', () => {
  beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(500));

  it('lists records newest first, mapped to domain records', async () => {
    const { db, repo } = setup();

    await expect(repo.list()).resolves.toEqual([
      { id: 'r1', title: 'Roof inspection', notes: 'North side', status: 'in_progress', createdAt: 100, updatedAt: 200 },
    ]);
    expect(db.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY updated_at DESC'));
  });

  it('gets one record, or null', async () => {
    const { repo } = setup();

    await expect(repo.get('r1')).resolves.toMatchObject({ id: 'r1' });
    await expect(repo.get('missing')).resolves.toBeNull();
  });

  it('creates a record with a new id and timestamps, using bound parameters', async () => {
    const { db, repo } = setup();

    const created = await repo.create({ title: "O'Brien site", notes: '', status: 'draft' });

    expect(created).toEqual({
      id: 'uuid-1',
      title: "O'Brien site",
      notes: '',
      status: 'draft',
      createdAt: 500,
      updatedAt: 500,
    });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO records'),
      'uuid-1',
      "O'Brien site",
      '',
      'draft',
      500,
      500
    );
  });

  it('updates a record and returns the stored version', async () => {
    const { db, repo } = setup();

    await expect(repo.update('r1', { title: 'Roof', notes: '', status: 'done' })).resolves.toMatchObject({ id: 'r1' });
    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('UPDATE records'), 'Roof', '', 'done', 500, 'r1');
  });

  it('throws not-found when updating a missing record', async () => {
    const { db, repo } = setup();
    db.runAsync.mockResolvedValue({ changes: 0, lastInsertRowId: 0 });

    await expect(repo.update('missing', { title: 'Roof', notes: '', status: 'done' })).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('propagates a locked vault', async () => {
    const repo = createSqliteRecordRepository(() => Promise.reject(new Error('locked')));
    await expect(repo.list()).rejects.toThrow('locked');
  });
});
