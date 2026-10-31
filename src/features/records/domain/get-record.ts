import type { FieldRecord } from '@/features/records/domain/field-record';
import type { RecordRepository } from '@/features/records/domain/record-repository';
import { appError } from '@/shared/domain/app-error';

export const makeGetRecord =
  (records: RecordRepository) =>
  async (id: string): Promise<FieldRecord> => {
    const record = await records.get(id);
    if (!record) throw appError('not-found', 'This record no longer exists.');
    return record;
  };
