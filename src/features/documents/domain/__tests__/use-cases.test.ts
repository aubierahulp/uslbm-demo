import type { DocumentPicker } from '@/features/documents/domain/document-picker';
import type { DocumentRepository, DownloadJob } from '@/features/documents/domain/document-repository';
import { makeDownloadDocument } from '@/features/documents/domain/download-document';
import { BENCHMARK_BYTES, type EncryptionBenchmark } from '@/features/documents/domain/encryption-benchmark';
import { makeImportDocument } from '@/features/documents/domain/import-document';
import { makeListDocuments } from '@/features/documents/domain/list-documents';
import { makeOpenDocument } from '@/features/documents/domain/open-document';
import { makeRunEncryptionBenchmark } from '@/features/documents/domain/run-encryption-benchmark';
import type { OnProgress, PickedFile, VaultDocument } from '@/features/documents/domain/vault-document';

const doc: VaultDocument = {
  id: 'd1',
  name: 'spec.pdf',
  mimeType: 'application/pdf',
  size: 10,
  sha256: 'abc',
  createdAt: 1,
};
const picked: PickedFile = { uri: 'file:///cache/spec.pdf', name: 'spec.pdf', mimeType: 'application/pdf' };
const job: DownloadJob = { result: Promise.resolve(doc), pause: jest.fn(), resume: jest.fn(), cancel: jest.fn() };

const fakeRepository = (): jest.Mocked<DocumentRepository> => ({
  list: jest.fn(async () => [doc]),
  importFile: jest.fn(async (_file: PickedFile, _onProgress: OnProgress) => doc),
  download: jest.fn((_url: string, _onProgress: OnProgress) => job),
  open: jest.fn(async (_id: string) => {}),
});

const onProgress = jest.fn();

describe('listDocuments', () => {
  it('returns the documents from the repository', async () => {
    await expect(makeListDocuments(fakeRepository())()).resolves.toEqual([doc]);
  });
});

describe('importDocument', () => {
  it('encrypts the picked file into the vault', async () => {
    const repo = fakeRepository();
    const picker: DocumentPicker = { pick: async () => picked };

    await expect(makeImportDocument(picker, repo)(onProgress)).resolves.toEqual(doc);
    expect(repo.importFile).toHaveBeenCalledWith(picked, onProgress);
  });

  it('does nothing when the user cancels the picker', async () => {
    const repo = fakeRepository();
    const picker: DocumentPicker = { pick: async () => null };

    await expect(makeImportDocument(picker, repo)(onProgress)).resolves.toBeNull();
    expect(repo.importFile).not.toHaveBeenCalled();
  });
});

describe('downloadDocument', () => {
  it('starts a download for a trimmed https link', () => {
    const repo = fakeRepository();

    expect(makeDownloadDocument(repo)('  https://example.com/files/spec.pdf ', onProgress)).toBe(job);
    expect(repo.download).toHaveBeenCalledWith('https://example.com/files/spec.pdf', onProgress);
  });

  it.each(['', 'example.com/spec.pdf', 'http://example.com/spec.pdf', 'https://', 'https://exa mple.com', 'file:///etc/passwd'])(
    'rejects %p without touching the repository',
    (url) => {
      const repo = fakeRepository();

      expect(() => makeDownloadDocument(repo)(url, onProgress)).toThrow('Enter a valid https:// link.');
      expect(repo.download).not.toHaveBeenCalled();
    }
  );
});

describe('openDocument', () => {
  it('opens the document by id', async () => {
    const repo = fakeRepository();
    await makeOpenDocument(repo)('d1');

    expect(repo.open).toHaveBeenCalledWith('d1');
  });
});

describe('runEncryptionBenchmark', () => {
  it('benchmarks a 100 MB file', async () => {
    const result = { bytes: BENCHMARK_BYTES, encryptMs: 1000, decryptMs: 900 };
    const benchmark: EncryptionBenchmark = { run: jest.fn(async () => result) };

    await expect(makeRunEncryptionBenchmark(benchmark)()).resolves.toEqual(result);
    expect(benchmark.run).toHaveBeenCalledWith(100 * 1024 * 1024);
  });
});
