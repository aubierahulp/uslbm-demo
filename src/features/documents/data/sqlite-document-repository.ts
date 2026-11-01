import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Buffer } from 'react-native-quick-crypto';

import type { DocumentRepository } from '@/features/documents/domain/document-repository';
import type { OnProgress, VaultDocument } from '@/features/documents/domain/vault-document';
import { decryptFile, encryptFile, plaintextDir } from '@/shared/data/file-cipher';
import { appError } from '@/shared/domain/app-error';

type DocumentRow = {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  sha256: string;
  created_at: number;
};

const toDocument = (row: DocumentRow): VaultDocument => ({
  id: row.id,
  name: row.name,
  mimeType: row.mime_type,
  size: row.size,
  sha256: row.sha256,
  createdAt: row.created_at,
});

const FALLBACK_MIME_TYPE = 'application/octet-stream';
const encryptedFile = (id: string) => new File(Paths.document, 'vault', `${id}.bin`);
const deleteIfExists = (entry: File | Directory) => entry.exists && entry.delete();
const extensionOf = (name: string) => /\.[a-z0-9]{1,8}$/i.exec(name)?.[0] ?? '';

export function createSqliteDocumentRepository(
  getDb: () => Promise<SQLiteDatabase>,
  getFileKey: () => Promise<Buffer>
): DocumentRepository {
  /** Encrypts a plaintext file into the vault and always deletes the plaintext. */
  async function store(source: File, name: string, mimeType: string, onProgress: OnProgress) {
    const id = Crypto.randomUUID();
    const target = encryptedFile(id);
    try {
      const [db, key] = await Promise.all([getDb(), getFileKey()]);
      const { size, sha256 } = await encryptFile(key, id, source, target, (done, total) =>
        onProgress({ phase: 'encrypting', done, total })
      );
      const doc: VaultDocument = { id, name, mimeType, size, sha256, createdAt: Date.now() };
      await db.runAsync(
        'INSERT INTO documents (id, name, mime_type, size, sha256, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        name,
        mimeType,
        size,
        sha256,
        doc.createdAt
      );
      return doc;
    } catch (error) {
      deleteIfExists(target);
      throw error;
    } finally {
      deleteIfExists(source);
    }
  }

  return {
    async list() {
      const rows = await (await getDb()).getAllAsync<DocumentRow>('SELECT * FROM documents ORDER BY created_at DESC');
      return rows.map(toDocument);
    },

    importFile(file, onProgress) {
      return store(new File(file.uri), file.name, file.mimeType, onProgress);
    },

    // ponytail: pause/resume lasts only while the app runs. Persist task.savable() to resume after a restart.
    download(url, onProgress) {
      const staging = plaintextDir(Crypto.randomUUID());
      staging.create({ intermediates: true });
      // A directory destination takes the file name from the response headers or the URL.
      const task = File.createDownloadTask(url, staging, {
        onProgress: ({ bytesWritten, totalBytes }) =>
          onProgress({ phase: 'downloading', done: bytesWritten, total: totalBytes > 0 ? totalBytes : null }),
      });

      let resolve!: (doc: VaultDocument) => void;
      let reject!: (error: unknown) => void;
      const result = new Promise<VaultDocument>((res, rej) => {
        resolve = res;
        reject = rej;
      });

      /** Pending downloads resolve with null when paused; the next resume settles the job. */
      const settle = async (pending: Promise<File | null>) => {
        let file: File | null;
        try {
          file = await pending;
        } catch {
          deleteIfExists(staging);
          return reject(appError('network', 'The download failed. Check the link and your connection.'));
        }
        if (!file) return;
        try {
          resolve(await store(file, file.name, file.type || FALLBACK_MIME_TYPE, onProgress));
        } catch (error) {
          reject(error);
        } finally {
          deleteIfExists(staging);
        }
      };
      settle(task.downloadAsync());

      return {
        result,
        pause: () => task.pauseAsync(),
        resume: () => void settle(task.resumeAsync()),
        cancel: () => task.cancel(),
      };
    },

    async open(id) {
      const [db, key] = await Promise.all([getDb(), getFileKey()]);
      const row = await db.getFirstAsync<DocumentRow>('SELECT * FROM documents WHERE id = ?', id);
      if (!row) throw appError('not-found', 'This document no longer exists.');

      // ponytail: the decrypted copy stays in the cache while the viewer is open (preview() resolves on present,
      // not on close). It is replaced by the next open and wiped when the vault locks or opens.
      deleteIfExists(plaintextDir('open'));
      const copy = new File(plaintextDir('open'), `${id}${extensionOf(row.name)}`);
      try {
        const sha256 = await decryptFile(key, id, encryptedFile(id), copy);
        if (sha256 !== row.sha256) throw appError('tampered', 'This document is damaged or has been tampered with.');
        if (!(await copy.canPreview({ mimeType: row.mime_type }))) {
          throw appError('unsupported', 'No app on this device can open this type of file.');
        }
        await copy.preview({ title: row.name, mimeType: row.mime_type });
      } catch (error) {
        deleteIfExists(copy);
        throw error;
      }
    },
  };
}
