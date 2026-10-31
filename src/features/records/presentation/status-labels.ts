import type { RecordStatus } from '@/features/records/domain/field-record';

export const STATUS_LABELS: Record<RecordStatus, string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  done: 'Done',
};
