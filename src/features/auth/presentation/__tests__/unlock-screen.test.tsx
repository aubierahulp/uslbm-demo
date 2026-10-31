import { fireEvent, render, screen } from '@testing-library/react-native';

import { logout, unlock } from '@/di';
import { useAuthStore } from '@/features/auth/presentation/auth-store';
import { UnlockScreen } from '@/features/auth/presentation/unlock-screen';
import { appError } from '@/shared/domain/app-error';

jest.mock('@/di', () => ({ unlock: jest.fn(), logout: jest.fn() }));

const user = { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'emily@x.com' };

describe('UnlockScreen', () => {
  beforeEach(() => useAuthStore.setState({ status: 'locked', user }));

  it('greets the user and unlocks', async () => {
    (unlock as jest.Mock).mockResolvedValue(undefined);
    await render(<UnlockScreen />);

    expect(screen.getByText('Welcome back, Emily')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock' }));

    expect(useAuthStore.getState().status).toBe('unlocked');
  });

  it('shows why unlocking failed', async () => {
    (unlock as jest.Mock).mockRejectedValue(appError('unlock-cancelled', 'Unlock was cancelled. Try again.'));
    await render(<UnlockScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Unlock' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unlock was cancelled. Try again.');
    expect(useAuthStore.getState().status).toBe('locked');
  });

  it('lets the user sign out instead', async () => {
    (logout as jest.Mock).mockResolvedValue(undefined);
    await render(<UnlockScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

    expect(useAuthStore.getState().status).toBe('signed-out');
  });
});
