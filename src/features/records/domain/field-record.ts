import { appError } from '@/shared/domain/app-error';

export const RECORD_STATUSES = ['draft', 'in_progress', 'done'] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

/** An inspection or site-visit record. Named FieldRecord to avoid TypeScript's built-in Record. */
export type FieldRecord = {
  id: string;
  title: string;
  notes: string;
  status: RecordStatus;
  createdAt: number;
  updatedAt: number;
};

export type RecordInput = Pick<FieldRecord, 'title' | 'notes' | 'status'>;

export const TITLE_MAX_LENGTH = 120;
export const NOTES_MAX_LENGTH = 10_000;

export function validateRecordInput(input: RecordInput): RecordInput {
  const title = input.title.trim();
  const notes = input.notes.trim();
  if (!title) throw appError('validation', 'Title is required.');
  if (title.length > TITLE_MAX_LENGTH) {
    throw appError('validation', `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
  }
  if (notes.length > NOTES_MAX_LENGTH) {
    throw appError('validation', `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`);
  }
  if (!RECORD_STATUSES.includes(input.status)) throw appError('validation', 'Choose a valid status.');
  return { title, notes, status: input.status };
}
