import { openEncryptedDatabase } from '@/shared/data/database';
import { wipePlaintext } from '@/shared/data/file-cipher';
import { getOrCreateMasterKey } from '@/shared/data/master-key';
import { createSqlcipherVault } from '@/shared/data/sqlcipher-vault';

jest.mock('@/shared/data/master-key', () => ({ getOrCreateMasterKey: jest.fn(async () => 'key') }));
jest.mock('@/shared/data/database', () => ({ openEncryptedDatabase: jest.fn() }));
jest.mock('@/shared/data/file-cipher', () => ({
  deriveFileKey: jest.fn(() => new Uint8Array([1, 2, 3])),
  wipePlaintext: jest.fn(),
}));

const openDb = openEncryptedDatabase as jest.Mock;

describe('createSqlcipherVault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openDb.mockImplementation(async () => ({ closeAsync: jest.fn() }));
  });

  it('is locked until opened', async () => {
    const vault = createSqlcipherVault();

    await expect(vault.getDatabase()).rejects.toMatchObject({ code: 'vault-locked' });
    await expect(vault.getFileKey()).rejects.toMatchObject({ code: 'vault-locked' });
  });

  it('opens one connection with the master key, even when opened concurrently', async () => {
    const vault = createSqlcipherVault();

    await Promise.all([vault.open(), vault.open()]);

    expect(getOrCreateMasterKey).toHaveBeenCalledTimes(1);
    expect(openDb).toHaveBeenCalledWith('key');
    await expect(vault.getDatabase()).resolves.toBeDefined();
  });

  it('releases a file key derived from the master key and wipes leftover plaintext', async () => {
    const vault = createSqlcipherVault();
    await vault.open();

    await expect(vault.getFileKey()).resolves.toEqual(new Uint8Array([1, 2, 3]));
    expect(wipePlaintext).toHaveBeenCalled();
  });

  it('closes the connection, zeroes the file key, wipes plaintext and locks again', async () => {
    const vault = createSqlcipherVault();
    await vault.open();
    const db = await vault.getDatabase();
    const fileKey = await vault.getFileKey();
    (wipePlaintext as jest.Mock).mockClear();

    await vault.close();

    expect(db.closeAsync).toHaveBeenCalled();
    expect(fileKey.every((byte) => byte === 0)).toBe(true);
    expect(wipePlaintext).toHaveBeenCalled();
    await expect(vault.getDatabase()).rejects.toMatchObject({ code: 'vault-locked' });
    await expect(vault.getFileKey()).rejects.toMatchObject({ code: 'vault-locked' });
  });

  it('stays locked and can retry when opening fails', async () => {
    const vault = createSqlcipherVault();
    openDb.mockRejectedValueOnce(new Error('file is not a database'));

    await expect(vault.open()).rejects.toThrow('file is not a database');
    await expect(vault.getDatabase()).rejects.toMatchObject({ code: 'vault-locked' });

    await vault.open();
    await expect(vault.getDatabase()).resolves.toBeDefined();
  });
});
