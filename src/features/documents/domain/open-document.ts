import type { DocumentRepository } from '@/features/documents/domain/document-repository';

export const makeOpenDocument = (documents: DocumentRepository) => (id: string): Promise<void> => documents.open(id);
