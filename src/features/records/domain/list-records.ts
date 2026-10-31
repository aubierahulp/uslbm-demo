import type { FieldRecord } from '@/features/records/domain/field-record';
import type { RecordRepository } from '@/features/records/domain/record-repository';

export const makeListRecords = (records: RecordRepository) => (): Promise<FieldRecord[]> => records.list();
