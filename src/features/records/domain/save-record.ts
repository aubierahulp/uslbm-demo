import { validateRecordInput, type FieldRecord, type RecordInput } from '@/features/records/domain/field-record';
import type { RecordRepository } from '@/features/records/domain/record-repository';

/** Creates a record, or updates it when an id is given. */
export const makeSaveRecord =
  (records: RecordRepository) =>
  (input: RecordInput, id?: string): Promise<FieldRecord> => {
    const valid = validateRecordInput(input);
    return id ? records.update(id, valid) : records.create(valid);
  };
