import type { DocumentRepository, DownloadJob } from '@/features/documents/domain/document-repository';
import { validateDownloadUrl, type OnProgress } from '@/features/documents/domain/vault-document';

export const makeDownloadDocument =
  (documents: DocumentRepository) =>
  (url: string, onProgress: OnProgress): DownloadJob =>
    documents.download(validateDownloadUrl(url), onProgress);
