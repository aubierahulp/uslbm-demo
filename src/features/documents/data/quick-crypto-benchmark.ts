import { File, FileMode } from 'expo-file-system';
import { randomBytes, type Buffer } from 'react-native-quick-crypto';

import type { EncryptionBenchmark } from '@/features/documents/domain/encryption-benchmark';
import { CHUNK_SIZE, decryptFile, encryptFile, plaintextDir } from '@/shared/data/file-cipher';

/** Runs the real document pipeline (file to file, in chunks) on random data. */
export function createQuickCryptoBenchmark(getFileKey: () => Promise<Buffer>): EncryptionBenchmark {
  return {
    async run(bytes) {
      const key = await getFileKey();
      const dir = plaintextDir('benchmark');
      const [plain, encrypted, decrypted] = ['plain', 'encrypted', 'decrypted'].map((name) => new File(dir, name));
      try {
        plain.create({ intermediates: true, overwrite: true });
        const handle = plain.open(FileMode.WriteOnly);
        try {
          for (let written = 0; written < bytes; written += CHUNK_SIZE) {
            await handle.writeBytes(randomBytes(Math.min(CHUNK_SIZE, bytes - written)));
          }
        } finally {
          handle.close();
        }

        let start = performance.now();
        const { sha256 } = await encryptFile(key, 'benchmark', plain, encrypted);
        const encryptMs = performance.now() - start;

        start = performance.now();
        const roundTrip = await decryptFile(key, 'benchmark', encrypted, decrypted);
        const decryptMs = performance.now() - start;

        if (roundTrip !== sha256) throw new Error('Benchmark round trip produced different data.');
        return { bytes, encryptMs, decryptMs };
      } finally {
        if (dir.exists) dir.delete();
      }
    },
  };
}
