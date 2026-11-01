import { makeApplyUpdate } from '@/features/updates/domain/apply-update';
import { makeCheckForUpdate } from '@/features/updates/domain/check-for-update';
import type { UpdateRepository } from '@/features/updates/domain/update-repository';

const fakeUpdates = ({ available = true, isNew = true } = {}): jest.Mocked<UpdateRepository> => ({
  getBuildInfo: jest.fn(),
  check: jest.fn(async () => available),
  download: jest.fn(async () => isNew),
  restart: jest.fn(async () => {}),
});

describe('checkForUpdate', () => {
  it('downloads an available update and reports it ready', async () => {
    const updates = fakeUpdates();

    await expect(makeCheckForUpdate(updates)()).resolves.toBe(true);
    expect(updates.download).toHaveBeenCalled();
  });

  it('does not download when nothing is available', async () => {
    const updates = fakeUpdates({ available: false });

    await expect(makeCheckForUpdate(updates)()).resolves.toBe(false);
    expect(updates.download).not.toHaveBeenCalled();
  });

  it('is not ready when the download brought nothing new', async () => {
    await expect(makeCheckForUpdate(fakeUpdates({ isNew: false }))()).resolves.toBe(false);
  });
});

describe('applyUpdate', () => {
  it('restarts the app', async () => {
    const updates = fakeUpdates();
    await makeApplyUpdate(updates)();

    expect(updates.restart).toHaveBeenCalled();
  });
});
