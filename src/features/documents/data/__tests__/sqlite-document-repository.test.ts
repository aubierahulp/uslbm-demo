import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { createSqliteDocumentRepository } from '@/features/documents/data/sqlite-document-repository';
import { decryptFile, encryptFile } from '@/shared/data/file-cipher';

const mockDeleted: string[] = [];

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid-1' }));
jest.mock('expo-file-system', () => {
  class Entry {
    uri: string;
    exists = true;
    type = '';
    create = jest.fn();
    canPreview = jest.fn(async () => true);
    preview = jest.fn(async () => {});
    constructor(...parts: (string | Entry)[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    get name() {
      return this.uri.split('/').pop();
    }
    delete() {
      mockDeleted.push(this.uri);
    }
    static createDownloadTask = jest.fn();
  }
  return { File: Entry, Directory: Entry, Paths: { document: 'documents', cache: 'cache' } };
});
jest.mock('@/shared/data/file-cipher', () => {
  const { Directory } = jest.requireMock('expo-file-system');
  return {
    encryptFile: jest.fn(),
    decryptFile: jest.fn(),
    plaintextDir: (...path: string[]) => new Directory('cache/plaintext', ...path),
  };
});

const KEY = new Uint8Array([7]);
const row = {
  id: 'd1',
  name: 'Spec sheet.PDF',
  mime_type: 'application/pdf',
  size: 2048,
  sha256: 'hash',
  created_at: 100,
};
const onProgress = jest.fn();

function setup() {
  const db = {
    getAllAsync: jest.fn(async () => [row]),
    getFirstAsync: jest.fn(async (_sql: string, id: string) => (id === row.id ? row : null)),
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
  };
  const repo = createSqliteDocumentRepository(
    async () => db as unknown as SQLiteDatabase,
    async () => KEY as never
  );
  return { db, repo };
}

function fakeDownloadTask() {
  const task = { downloadAsync: jest.fn(), resumeAsync: jest.fn(), pauseAsync: jest.fn(), cancel: jest.fn() };
  (File.createDownloadTask as jest.Mock).mockReturnValue(task);
  const reportProgress = (bytesWritten: number, totalBytes: number) =>
    (File.createDownloadTask as jest.Mock).mock.calls[0][2].onProgress({ bytesWritten, totalBytes });
  return { task, reportProgress };
}

const downloaded = () => Object.assign(new File('cache/plaintext/uuid-1/spec.pdf'), { type: 'application/pdf' });

describe('createSqliteDocumentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleted.length = 0;
    jest.spyOn(Date, 'now').mockReturnValue(500);
    (encryptFile as jest.Mock).mockImplementation(async (_key, _id, _source, _target, progress) => {
      progress?.(2048, 2048);
      return { size: 2048, sha256: 'hash' };
    });
    (decryptFile as jest.Mock).mockResolvedValue('hash');
  });

  it('lists documents newest first, mapped to domain documents', async () => {
    const { db, repo } = setup();

    await expect(repo.list()).resolves.toEqual([
      { id: 'd1', name: 'Spec sheet.PDF', mimeType: 'application/pdf', size: 2048, sha256: 'hash', createdAt: 100 },
    ]);
    expect(db.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY created_at DESC'));
  });

  describe('importFile', () => {
    it('encrypts into the vault, records it with bound parameters and deletes the plaintext', async () => {
      const { db, repo } = setup();

      const doc = await repo.importFile(
        { uri: 'file:///cache/DocumentPicker/spec.pdf', name: "O'Brien spec.pdf", mimeType: 'application/pdf' },
        onProgress
      );

      expect(doc).toEqual({
        id: 'uuid-1',
        name: "O'Brien spec.pdf",
        mimeType: 'application/pdf',
        size: 2048,
        sha256: 'hash',
        createdAt: 500,
      });
      const [key, id, source, target] = (encryptFile as jest.Mock).mock.calls[0];
      expect([key, id, source.uri, target.uri]).toEqual([KEY, 'uuid-1', 'file:///cache/DocumentPicker/spec.pdf', 'documents/vault/uuid-1.bin']);
      expect(onProgress).toHaveBeenCalledWith({ phase: 'encrypting', done: 2048, total: 2048 });
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO documents'),
        'uuid-1',
        "O'Brien spec.pdf",
        'application/pdf',
        2048,
        'hash',
        500
      );
      expect(mockDeleted).toEqual(['file:///cache/DocumentPicker/spec.pdf']);
    });

    it('removes the partial encrypted file and the plaintext when encryption fails', async () => {
      const { db, repo } = setup();
      (encryptFile as jest.Mock).mockRejectedValue(new Error('disk full'));

      await expect(
        repo.importFile({ uri: 'file:///cache/spec.pdf', name: 'spec.pdf', mimeType: 'application/pdf' }, onProgress)
      ).rejects.toThrow('disk full');
      expect(db.runAsync).not.toHaveBeenCalled();
      expect(mockDeleted).toEqual(['documents/vault/uuid-1.bin', 'file:///cache/spec.pdf']);
    });

    it('propagates a locked vault and still deletes the plaintext', async () => {
      const repo = createSqliteDocumentRepository(
        () => Promise.reject(new Error('locked')),
        async () => KEY as never
      );

      await expect(repo.importFile({ uri: 'file:///cache/spec.pdf', name: 's', mimeType: 'm' }, onProgress)).rejects.toThrow('locked');
      expect(encryptFile).not.toHaveBeenCalled();
      expect(mockDeleted).toContain('file:///cache/spec.pdf');
    });
  });

  describe('download', () => {
    it('downloads into a plaintext staging folder, reports progress, then encrypts and cleans up', async () => {
      const { repo } = setup();
      const { task, reportProgress } = fakeDownloadTask();
      task.downloadAsync.mockResolvedValue(downloaded());

      const job = repo.download('https://example.com/spec.pdf', onProgress);
      reportProgress(10, 100);
      reportProgress(20, -1);

      await expect(job.result).resolves.toMatchObject({ id: 'uuid-1', name: 'spec.pdf', mimeType: 'application/pdf' });
      expect((File.createDownloadTask as jest.Mock).mock.calls[0].slice(0, 2)).toEqual([
        'https://example.com/spec.pdf',
        expect.objectContaining({ uri: 'cache/plaintext/uuid-1' }),
      ]);
      expect(onProgress).toHaveBeenCalledWith({ phase: 'downloading', done: 10, total: 100 });
      expect(onProgress).toHaveBeenCalledWith({ phase: 'downloading', done: 20, total: null });
      expect(mockDeleted).toEqual(['cache/plaintext/uuid-1/spec.pdf', 'cache/plaintext/uuid-1']);
    });

    it('keeps the partial download while paused and finishes after resume', async () => {
      const { repo } = setup();
      const { task } = fakeDownloadTask();
      task.downloadAsync.mockResolvedValue(null);
      task.resumeAsync.mockResolvedValue(downloaded());

      const job = repo.download('https://example.com/spec.pdf', onProgress);
      await job.pause();
      await Promise.resolve();
      expect(mockDeleted).toEqual([]);

      job.resume();
      await expect(job.result).resolves.toMatchObject({ name: 'spec.pdf' });
      expect(task.pauseAsync).toHaveBeenCalled();
    });

    it('maps a failed or cancelled download to a network error and removes the staging folder', async () => {
      const { repo } = setup();
      const { task } = fakeDownloadTask();
      task.downloadAsync.mockRejectedValue(new Error('server returned HTTP 404'));

      const job = repo.download('https://example.com/missing.pdf', onProgress);
      job.cancel();

      await expect(job.result).rejects.toMatchObject({ code: 'network' });
      expect(task.cancel).toHaveBeenCalled();
      expect(encryptFile).not.toHaveBeenCalled();
      expect(mockDeleted).toEqual(['cache/plaintext/uuid-1']);
    });
  });

  describe('open', () => {
    it('decrypts a fresh copy, checks its hash and previews it', async () => {
      const { repo } = setup();

      await repo.open('d1');

      const [key, id, source, copy] = (decryptFile as jest.Mock).mock.calls[0];
      expect([key, id, source.uri, copy.uri]).toEqual([KEY, 'd1', 'documents/vault/d1.bin', 'cache/plaintext/open/d1.PDF']);
      expect(mockDeleted).toEqual(['cache/plaintext/open']);
      expect(copy.preview).toHaveBeenCalledWith({ title: 'Spec sheet.PDF', mimeType: 'application/pdf' });
    });

    it('refuses to show a copy whose hash does not match', async () => {
      const { repo } = setup();
      (decryptFile as jest.Mock).mockResolvedValue('other-hash');

      await expect(repo.open('d1')).rejects.toMatchObject({ code: 'tampered' });
      expect(mockDeleted).toContain('cache/plaintext/open/d1.PDF');
    });

    it('deletes the copy when decryption fails', async () => {
      const { repo } = setup();
      (decryptFile as jest.Mock).mockRejectedValue(Object.assign(new Error('bad'), { code: 'tampered' }));

      await expect(repo.open('d1')).rejects.toMatchObject({ code: 'tampered' });
      expect(mockDeleted).toContain('cache/plaintext/open/d1.PDF');
    });

    it('throws unsupported when no app can show the file', async () => {
      const { repo } = setup();
      (decryptFile as jest.Mock).mockImplementation(async (_key, _id, _source, copy) => {
        copy.canPreview.mockResolvedValue(false);
        return 'hash';
      });

      await expect(repo.open('d1')).rejects.toMatchObject({ code: 'unsupported' });
      expect(mockDeleted).toContain('cache/plaintext/open/d1.PDF');
    });

    it('throws not-found for an unknown id', async () => {
      const { repo } = setup();

      await expect(repo.open('missing')).rejects.toMatchObject({ code: 'not-found' });
      expect(decryptFile).not.toHaveBeenCalled();
    });
  });
});
