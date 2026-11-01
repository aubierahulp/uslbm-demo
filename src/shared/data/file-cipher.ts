import { Directory, File, FileMode, Paths } from 'expo-file-system';
import { Buffer, createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'react-native-quick-crypto';

import { appError } from '@/shared/domain/app-error';

/**
 * Files are encrypted in independent AES-256-GCM chunks so a 100 MB+ file never sits in memory.
 * Each chunk on disk is `iv (12) | ciphertext | tag (16)` with a fresh random IV. The AAD binds the
 * chunk to its file id, its position and whether it is the last one, so swapped, reordered or
 * truncated chunks fail to decrypt.
 */
export const CHUNK_SIZE = 1024 * 1024;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';

export type ChunkProgress = (done: number, total: number) => void;

/** Separate key for files, so the SQLCipher key is never used for anything else. */
export const deriveFileKey = (masterKeyHex: string): Buffer =>
  Buffer.from(hkdfSync('sha256', Buffer.from(masterKeyHex, 'hex'), '', 'field-vault/files/v1', 32));

const aad = (fileId: string, index: number, last: boolean) => Buffer.from(`${fileId}:${index}:${last ? 1 : 0}`);

const openForWriting = (file: File) => {
  file.create({ overwrite: true, intermediates: true });
  return file.open(FileMode.WriteOnly);
};

/** Encrypts `source` into `target`. Returns the plaintext size and SHA-256. */
export async function encryptFile(key: Buffer, fileId: string, source: File, target: File, onProgress?: ChunkProgress) {
  const total = source.size;
  const hash = createHash('sha256');
  const input = source.open(FileMode.ReadOnly);
  const output = openForWriting(target);
  try {
    for (let index = 0, done = 0; ; index++) {
      const chunk = await input.readBytes(CHUNK_SIZE);
      done += chunk.length;
      // An empty file still gets one (empty) last chunk, so truncation to zero is detected.
      const last = done >= total;
      hash.update(chunk);

      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      cipher.setAAD(aad(fileId, index, last));
      await output.writeBytes(Buffer.concat([iv, cipher.update(chunk), cipher.final(), cipher.getAuthTag()]));
      onProgress?.(done, total);

      if (last) return { size: done, sha256: hash.digest('hex') };
    }
  } finally {
    input.close();
    output.close();
  }
}

/** Decrypts `source` into `target` and returns the plaintext SHA-256. Throws AppError 'tampered' on any auth failure. */
export async function decryptFile(key: Buffer, fileId: string, source: File, target: File, onProgress?: ChunkProgress) {
  const total = source.size;
  const hash = createHash('sha256');
  const input = source.open(FileMode.ReadOnly);
  const output = openForWriting(target);
  try {
    for (let index = 0, read = 0; ; index++) {
      const chunk = Buffer.from(await input.readBytes(IV_LENGTH + CHUNK_SIZE + TAG_LENGTH));
      read += chunk.length;
      const last = read >= total;

      let plaintext: Buffer;
      try {
        if (chunk.length < IV_LENGTH + TAG_LENGTH) throw new Error('Chunk too short.');
        const decipher = createDecipheriv(ALGORITHM, key, chunk.subarray(0, IV_LENGTH));
        decipher.setAAD(aad(fileId, index, last));
        decipher.setAuthTag(chunk.subarray(chunk.length - TAG_LENGTH));
        plaintext = Buffer.concat([decipher.update(chunk.subarray(IV_LENGTH, chunk.length - TAG_LENGTH)), decipher.final()]);
      } catch {
        throw appError('tampered', 'This document is damaged or has been tampered with.');
      }
      hash.update(plaintext);
      await output.writeBytes(plaintext);
      onProgress?.(read, total);

      if (last) return hash.digest('hex');
    }
  } finally {
    input.close();
    output.close();
  }
}

/** Scratch space for plaintext: downloads and imports before encryption, and decrypted copies being viewed. */
export const plaintextDir = (...path: string[]) => new Directory(Paths.cache, 'plaintext', ...path);

export function wipePlaintext() {
  const dir = plaintextDir();
  if (dir.exists) dir.delete();
}
