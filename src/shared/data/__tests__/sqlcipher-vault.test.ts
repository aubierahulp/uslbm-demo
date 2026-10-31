import { openEncryptedDatabase } from '@/shared/data/database';
import { getOrCreateMasterKey } from '@/shared/data/master-key';
import { createSqlcipherVault } from '@/shared/data/sqlcipher-vault';

jest.mock('@/shared/data/master-key', () => ({ getOrCreateMasterKey: jest.fn(async () => 'key') }));
jest.mock('@/shared/data/database', () => ({ openEncryptedDatabase: jest.fn() }));

const openDb = openEncryptedDatabase as jest.Mock;

describe('createSqlcipherVault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openDb.mockImplementation(async () => ({ closeAsync: jest.fn() }));
  });

  it('is locked until opened', async () => {
    await expect(createSqlcipherVault().getDatabase()).rejects.toMatchObject({ code: 'vault-locked' });
  });

  it('opens one connection with the master key, even when opened concurrently', async () => {
    const vault = createSqlcipherVault();

    await Promise.all([vault.open(), vault.open()]);

    expect(getOrCreateMasterKey).toHaveBeenCalledTimes(1);
    expect(openDb).toHaveBeenCalledWith('key');
    await expect(vault.getDatabase()).resolves.toBeDefined();
  });

  it('closes the connection and locks again', async () => {
    const vault = createSqlcipherVault();
    await vault.open();
    const db = await vault.getDatabase();

    await vault.close();

    expect(db.closeAsync).toHaveBeenCalled();
    await expect(vault.getDatabase()).rejects.toMatchObject({ code: 'vault-locked' });
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
