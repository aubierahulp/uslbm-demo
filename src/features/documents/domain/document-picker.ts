import type { PickedFile } from '@/features/documents/domain/vault-document';

export interface DocumentPicker {
  /** Null when the user cancels. */
  pick(): Promise<PickedFile | null>;
}
