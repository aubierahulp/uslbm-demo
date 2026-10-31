import type { FieldRecord, RecordInput } from '@/features/records/domain/field-record';

export interface RecordRepository {
  /** Most recently updated first. */
  list(): Promise<FieldRecord[]>;
  get(id: string): Promise<FieldRecord | null>;
  create(input: RecordInput): Promise<FieldRecord>;
  /** Throws AppError 'not-found' when no record has this id. */
  update(id: string, input: RecordInput): Promise<FieldRecord>;
}
