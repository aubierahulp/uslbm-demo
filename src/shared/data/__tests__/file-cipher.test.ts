import { Directory, type File } from 'expo-file-system';
import { Buffer, createHash, randomBytes } from 'react-native-quick-crypto';

import { CHUNK_SIZE, decryptFile, deriveFileKey, encryptFile, wipePlaintext } from '@/shared/data/file-cipher';

// Node's crypto has the same API as react-native-quick-crypto, so these tests run real AES-256-GCM.
jest.mock('react-native-quick-crypto', () => ({ ...jest.requireActual('crypto'), Buffer: jest.requireActual('buffer').Buffer }));
const mockDirectory = { exists: true, delete: jest.fn() };
jest.mock('expo-file-system', () => ({
  FileMode: { ReadOnly: 'r', WriteOnly: 'w' },
  Paths: { cache: 'cache' },
  Directory: jest.fn(() => mockDirectory),
}));

/** In-memory stand-in for an expo-file-system File with a FileHandle. */
function memoryFile(initial: Uint8Array = new Uint8Array()) {
  const file = {
    data: Buffer.from(initial),
    get size() {
      return file.data.length;
    },
    create: () => {
      file.data = Buffer.alloc(0);
    },
    open: () => {
      let offset = 0;
      return {
        readBytes: async (length: number) => {
          const chunk = file.data.subarray(offset, offset + length);
          offset += chunk.length;
          return new Uint8Array(chunk);
        },
        writeBytes: async (bytes: Uint8Array) => {
          file.data = Buffer.concat([file.data, bytes]);
        },
        close: () => {},
      };
    },
  };
  return file as typeof file & File;
}

const KEY = deriveFileKey('ab'.repeat(32));
const IV_AND_TAG = 28;
const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

async function encrypt(plaintext: Uint8Array, fileId = 'doc-1') {
  const encrypted = memoryFile();
  const result = await encryptFile(KEY, fileId, memoryFile(plaintext), encrypted);
  return { encrypted, ...result };
}

const decrypt = async (encrypted: File, key = KEY, fileId = 'doc-1') => {
  const output = memoryFile();
  const hash = await decryptFile(key, fileId, encrypted, output);
  return { hash, plaintext: (output as ReturnType<typeof memoryFile>).data };
};

describe('file cipher', () => {
  const plaintext = randomBytes(CHUNK_SIZE * 2 + 1234);

  it('round-trips a multi-chunk file and reports its size and SHA-256', async () => {
    const { encrypted, size, sha256: hash } = await encrypt(plaintext);

    expect(size).toBe(plaintext.length);
    expect(hash).toBe(sha256(plaintext));
    expect(encrypted.size).toBe(plaintext.length + 3 * IV_AND_TAG);
    expect(encrypted.data.includes(plaintext.subarray(0, 64))).toBe(false);

    const decrypted = await decrypt(encrypted);
    expect(decrypted.plaintext.equals(plaintext)).toBe(true);
    expect(decrypted.hash).toBe(hash);
  });

  it('round-trips an empty file', async () => {
    const { encrypted } = await encrypt(new Uint8Array());

    expect(encrypted.size).toBe(IV_AND_TAG);
    await expect(decrypt(encrypted)).resolves.toMatchObject({ hash: sha256(new Uint8Array()) });
  });

  it('reports progress per chunk', async () => {
    const onProgress = jest.fn();
    await encryptFile(KEY, 'doc-1', memoryFile(plaintext), memoryFile(), onProgress);

    expect(onProgress.mock.calls).toEqual([
      [CHUNK_SIZE, plaintext.length],
      [CHUNK_SIZE * 2, plaintext.length],
      [plaintext.length, plaintext.length],
    ]);
  });

  it('uses a unique IV for every chunk and every encryption', async () => {
    const first = await encrypt(plaintext);
    const second = await encrypt(plaintext);
    const ivs = [first, second].flatMap(({ encrypted }) =>
      [0, 1, 2].map((i) => encrypted.data.subarray(i * (CHUNK_SIZE + IV_AND_TAG), i * (CHUNK_SIZE + IV_AND_TAG) + 12).toString('hex'))
    );

    expect(new Set(ivs).size).toBe(6);
    expect(first.encrypted.data.equals(second.encrypted.data)).toBe(false);
  });

  it('fails with the wrong key', async () => {
    const { encrypted } = await encrypt(plaintext);

    await expect(decrypt(encrypted, deriveFileKey('cd'.repeat(32)))).rejects.toMatchObject({ code: 'tampered' });
  });

  it('fails when a single byte is changed', async () => {
    const { encrypted } = await encrypt(plaintext);
    encrypted.data[CHUNK_SIZE + 100] ^= 1;

    await expect(decrypt(encrypted)).rejects.toMatchObject({ code: 'tampered' });
  });

  it('fails when the last chunk is cut off', async () => {
    const { encrypted } = await encrypt(plaintext);
    encrypted.data = encrypted.data.subarray(0, 2 * (CHUNK_SIZE + IV_AND_TAG));

    await expect(decrypt(encrypted)).rejects.toMatchObject({ code: 'tampered' });
  });

  it('fails when chunks are reordered', async () => {
    const { encrypted } = await encrypt(plaintext);
    const chunk = CHUNK_SIZE + IV_AND_TAG;
    encrypted.data = Buffer.concat([
      encrypted.data.subarray(chunk, 2 * chunk),
      encrypted.data.subarray(0, chunk),
      encrypted.data.subarray(2 * chunk),
    ]);

    await expect(decrypt(encrypted)).rejects.toMatchObject({ code: 'tampered' });
  });

  it('fails when a file is decrypted under another document id', async () => {
    const { encrypted } = await encrypt(plaintext, 'doc-1');

    await expect(decrypt(encrypted, KEY, 'doc-2')).rejects.toMatchObject({ code: 'tampered' });
  });
});

describe('deriveFileKey', () => {
  it('derives a stable 256-bit key that differs from the master key', () => {
    const master = 'ab'.repeat(32);

    expect(deriveFileKey(master)).toHaveLength(32);
    expect(deriveFileKey(master).equals(deriveFileKey(master))).toBe(true);
    expect(deriveFileKey(master).toString('hex')).not.toBe(master);
  });
});

describe('wipePlaintext', () => {
  it('deletes the plaintext scratch folder in the cache when it exists', () => {
    mockDirectory.exists = true;
    wipePlaintext();

    expect(Directory).toHaveBeenCalledWith('cache', 'plaintext');
    expect(mockDirectory.delete).toHaveBeenCalledTimes(1);

    mockDirectory.exists = false;
    wipePlaintext();
    expect(mockDirectory.delete).toHaveBeenCalledTimes(1);
  });
});
