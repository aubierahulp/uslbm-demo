import type { FieldRecord, RecordInput } from '@/features/records/domain/field-record';
import { makeGetRecord } from '@/features/records/domain/get-record';
import { makeListRecords } from '@/features/records/domain/list-records';
import type { RecordRepository } from '@/features/records/domain/record-repository';
import { makeSaveRecord } from '@/features/records/domain/save-record';

const record: FieldRecord = {
  id: 'r1',
  title: 'Roof inspection',
  notes: '',
  status: 'draft',
  createdAt: 1,
  updatedAt: 1,
};

const fakeRepository = (): jest.Mocked<RecordRepository> => ({
  list: jest.fn(async () => [record]),
  get: jest.fn(async (id) => (id === record.id ? record : null)),
  create: jest.fn(async (_input: RecordInput) => record),
  update: jest.fn(async (_id: string, _input: RecordInput) => record),
});

describe('listRecords', () => {
  it('returns the records from the repository', async () => {
    await expect(makeListRecords(fakeRepository())()).resolves.toEqual([record]);
  });
});

describe('getRecord', () => {
  it('returns the record', async () => {
    await expect(makeGetRecord(fakeRepository())('r1')).resolves.toEqual(record);
  });

  it('throws not-found for an unknown id', async () => {
    await expect(makeGetRecord(fakeRepository())('missing')).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('saveRecord', () => {
  it('creates a new record with validated input', async () => {
    const repo = fakeRepository();
    await makeSaveRecord(repo)({ title: ' Roof ', notes: '', status: 'draft' });

    expect(repo.create).toHaveBeenCalledWith({ title: 'Roof', notes: '', status: 'draft' });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates an existing record when an id is given', async () => {
    const repo = fakeRepository();
    await makeSaveRecord(repo)({ title: 'Roof', notes: '', status: 'done' }, 'r1');

    expect(repo.update).toHaveBeenCalledWith('r1', { title: 'Roof', notes: '', status: 'done' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('does not touch the repository when input is invalid', async () => {
    const repo = fakeRepository();

    expect(() => makeSaveRecord(repo)({ title: '', notes: '', status: 'draft' })).toThrow('Title is required.');
    expect(repo.create).not.toHaveBeenCalled();
  });
});
