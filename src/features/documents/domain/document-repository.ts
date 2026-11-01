import type { OnProgress, PickedFile, VaultDocument } from '@/features/documents/domain/vault-document';

/** A running download. `result` settles once the file is downloaded and encrypted. */
export type DownloadJob = {
  result: Promise<VaultDocument>;
  pause(): Promise<void>;
  resume(): void;
  cancel(): void;
};

export interface DocumentRepository {
  /** Newest first. */
  list(): Promise<VaultDocument[]>;
  /** Encrypts the file into the vault and removes the plaintext copy. */
  importFile(file: PickedFile, onProgress: OnProgress): Promise<VaultDocument>;
  download(url: string, onProgress: OnProgress): DownloadJob;
  /** Decrypts to a temporary copy and shows it in the system viewer. Throws AppError 'tampered' or 'unsupported'. */
  open(id: string): Promise<void>;
}
