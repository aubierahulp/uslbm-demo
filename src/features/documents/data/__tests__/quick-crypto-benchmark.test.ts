import { createQuickCryptoBenchmark } from '@/features/documents/data/quick-crypto-benchmark';
import { CHUNK_SIZE, decryptFile, encryptFile } from '@/shared/data/file-cipher';

const mockWrites: number[] = [];
const mockDeleted: string[] = [];

jest.mock('react-native-quick-crypto', () => ({ randomBytes: (size: number) => new Uint8Array(size) }));
jest.mock('expo-file-system', () => ({
  FileMode: { WriteOnly: 'w' },
  File: class {
    uri: string;
    constructor(dir: { uri: string }, name: string) {
      this.uri = `${dir.uri}/${name}`;
    }
    create() {}
    open() {
      return { writeBytes: async (bytes: Uint8Array) => mockWrites.push(bytes.length), close: () => {} };
    }
  },
}));
jest.mock('@/shared/data/file-cipher', () => ({
  CHUNK_SIZE: 1024,
  encryptFile: jest.fn(),
  decryptFile: jest.fn(),
  plaintextDir: (name: string) => ({ uri: `cache/plaintext/${name}`, exists: true, delete: () => mockDeleted.push(name) }),
}));

const KEY = new Uint8Array([7]);
const benchmark = createQuickCryptoBenchmark(async () => KEY as never);

describe('createQuickCryptoBenchmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWrites.length = 0;
    mockDeleted.length = 0;
    let now = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => (now += 500));
    (encryptFile as jest.Mock).mockResolvedValue({ size: 2500, sha256: 'hash' });
    (decryptFile as jest.Mock).mockResolvedValue('hash');
  });

  it('writes random data in chunks, then times encryption and decryption of the files', async () => {
    await expect(benchmark.run(2500)).resolves.toEqual({ bytes: 2500, encryptMs: 500, decryptMs: 500 });

    expect(mockWrites).toEqual([CHUNK_SIZE, CHUNK_SIZE, 452]);
    const [key, , plain, encrypted] = (encryptFile as jest.Mock).mock.calls[0];
    expect([key, plain.uri, encrypted.uri]).toEqual([KEY, 'cache/plaintext/benchmark/plain', 'cache/plaintext/benchmark/encrypted']);
    expect((decryptFile as jest.Mock).mock.calls[0][2]).toBe(encrypted);
    expect(mockDeleted).toEqual(['benchmark']);
  });

  it('fails when the round trip does not match, and still cleans up', async () => {
    (decryptFile as jest.Mock).mockResolvedValue('other');

    await expect(benchmark.run(2500)).rejects.toThrow('different data');
    expect(mockDeleted).toEqual(['benchmark']);
  });
});
