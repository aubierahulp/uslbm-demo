import type { DocumentRepository } from '@/features/documents/domain/document-repository';
import type { VaultDocument } from '@/features/documents/domain/vault-document';

export const makeListDocuments = (documents: DocumentRepository) => (): Promise<VaultDocument[]> => documents.list();
