import type { DocumentPicker } from '@/features/documents/domain/document-picker';
import type { DocumentRepository } from '@/features/documents/domain/document-repository';
import type { OnProgress, VaultDocument } from '@/features/documents/domain/vault-document';

/** Resolves to null when the user cancels the picker. */
export const makeImportDocument =
  (picker: DocumentPicker, documents: DocumentRepository) =>
  async (onProgress: OnProgress): Promise<VaultDocument | null> => {
    const file = await picker.pick();
    return file ? documents.importFile(file, onProgress) : null;
  };
