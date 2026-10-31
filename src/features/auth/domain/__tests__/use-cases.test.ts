import type { AuthApi } from '@/features/auth/domain/auth-api';
import type { BiometricGate, BiometricResult } from '@/features/auth/domain/biometric-gate';
import { makeLogin } from '@/features/auth/domain/login';
import { makeLogout } from '@/features/auth/domain/logout';
import { makeRestoreSession } from '@/features/auth/domain/restore-session';
import type { Session } from '@/features/auth/domain/session';
import type { SessionStore } from '@/features/auth/domain/session-store';
import { makeUnlock } from '@/features/auth/domain/unlock';
import type { DataVault } from '@/shared/domain/data-vault';

const session: Session = {
  user: { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'emily@x.com' },
  accessToken: 'access',
  refreshToken: 'refresh',
};

const fakeApi = (): jest.Mocked<AuthApi> => ({ login: jest.fn(async (_username: string, _password: string) => session) });
const fakeStore = (stored: Session | null = null): jest.Mocked<SessionStore> => ({
  load: jest.fn(async () => stored),
  save: jest.fn(async (_session: Session) => {}),
  clear: jest.fn(async () => {}),
});
const fakeVault = (): jest.Mocked<DataVault> => ({ open: jest.fn(async () => {}), close: jest.fn(async () => {}) });
const fakeGate = (result: BiometricResult): BiometricGate => ({ authenticate: async () => result });

describe('login', () => {
  it('signs in, stores the session and opens the vault', async () => {
    const api = fakeApi();
    const store = fakeStore();
    const vault = fakeVault();

    const user = await makeLogin(api, store, vault)('  emilys ', 'emilyspass');

    expect(api.login).toHaveBeenCalledWith('emilys', 'emilyspass');
    expect(store.save).toHaveBeenCalledWith(session);
    expect(vault.open).toHaveBeenCalled();
    expect(user).toEqual(session.user);
  });

  it.each([
    ['', 'pass'],
    ['   ', 'pass'],
    ['emilys', ''],
  ])('rejects missing credentials (%p, %p) without calling the API', async (username, password) => {
    const api = fakeApi();

    await expect(makeLogin(api, fakeStore(), fakeVault())(username, password)).rejects.toMatchObject({
      code: 'validation',
    });
    expect(api.login).not.toHaveBeenCalled();
  });

  it('does not store anything when the API rejects', async () => {
    const api = fakeApi();
    api.login.mockRejectedValue(new Error('invalid'));
    const store = fakeStore();
    const vault = fakeVault();

    await expect(makeLogin(api, store, vault)('emilys', 'wrong')).rejects.toThrow('invalid');
    expect(store.save).not.toHaveBeenCalled();
    expect(vault.open).not.toHaveBeenCalled();
  });
});

describe('restoreSession', () => {
  it('returns the stored user', async () => {
    await expect(makeRestoreSession(fakeStore(session))()).resolves.toEqual(session.user);
  });

  it('returns null when nobody is signed in', async () => {
    await expect(makeRestoreSession(fakeStore())()).resolves.toBeNull();
  });
});

describe('unlock', () => {
  it('opens the vault after successful authentication', async () => {
    const vault = fakeVault();
    await makeUnlock(fakeGate('success'), vault)();
    expect(vault.open).toHaveBeenCalled();
  });

  it.each([
    ['cancelled', 'unlock-cancelled'],
    ['unavailable', 'biometrics-unavailable'],
  ] as const)('keeps the vault closed when authentication is %s', async (result, code) => {
    const vault = fakeVault();
    await expect(makeUnlock(fakeGate(result), vault)()).rejects.toMatchObject({ code });
    expect(vault.open).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('closes the vault and clears the session', async () => {
    const store = fakeStore(session);
    const vault = fakeVault();

    await makeLogout(store, vault)();

    expect(vault.close).toHaveBeenCalled();
    expect(store.clear).toHaveBeenCalled();
  });
});
