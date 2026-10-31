import { login, logout, restoreSession, unlock } from '@/di';
import { useAuthStore } from '@/features/auth/presentation/auth-store';

jest.mock('@/di', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  restoreSession: jest.fn(),
  unlock: jest.fn(),
}));

const user = { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'emily@x.com' };
const initialState = useAuthStore.getState();

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState(initialState, true);
  });

  it('starts locked when a session is stored', async () => {
    (restoreSession as jest.Mock).mockResolvedValue(user);
    await useAuthStore.getState().restore();
    expect(useAuthStore.getState()).toMatchObject({ status: 'locked', user });
  });

  it('starts signed out when no session is stored', async () => {
    (restoreSession as jest.Mock).mockResolvedValue(null);
    await useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('signed-out');
  });

  it('falls back to signed out when restoring fails', async () => {
    (restoreSession as jest.Mock).mockRejectedValue(new Error('keystore'));
    await expect(useAuthStore.getState().restore()).rejects.toThrow('keystore');
    expect(useAuthStore.getState().status).toBe('signed-out');
  });

  it('is unlocked after signing in', async () => {
    (login as jest.Mock).mockResolvedValue(user);
    await useAuthStore.getState().login('emilys', 'emilyspass');
    expect(useAuthStore.getState()).toMatchObject({ status: 'unlocked', user });
  });

  it('stays signed out when signing in fails', async () => {
    useAuthStore.setState({ status: 'signed-out' });
    (login as jest.Mock).mockRejectedValue(new Error('invalid'));
    await expect(useAuthStore.getState().login('emilys', 'wrong')).rejects.toThrow('invalid');
    expect(useAuthStore.getState().status).toBe('signed-out');
  });

  it('unlocks, and stays locked when unlock fails', async () => {
    useAuthStore.setState({ status: 'locked', user });
    (unlock as jest.Mock).mockRejectedValueOnce(new Error('cancelled'));
    await expect(useAuthStore.getState().unlock()).rejects.toThrow('cancelled');
    expect(useAuthStore.getState().status).toBe('locked');

    (unlock as jest.Mock).mockResolvedValue(undefined);
    await useAuthStore.getState().unlock();
    expect(useAuthStore.getState().status).toBe('unlocked');
  });

  it('clears the user on logout', async () => {
    useAuthStore.setState({ status: 'unlocked', user });
    await useAuthStore.getState().logout();
    expect(logout).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ status: 'signed-out', user: null });
  });
});
