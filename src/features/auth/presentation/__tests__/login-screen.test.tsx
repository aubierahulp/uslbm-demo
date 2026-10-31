import { fireEvent, render, screen } from '@testing-library/react-native';

import { login } from '@/di';
import { LoginScreen } from '@/features/auth/presentation/login-screen';
import { useAuthStore } from '@/features/auth/presentation/auth-store';
import { appError } from '@/shared/domain/app-error';

jest.mock('@/di', () => ({ login: jest.fn() }));

describe('LoginScreen', () => {
  beforeEach(() => useAuthStore.setState({ status: 'signed-out', user: null }));

  it('signs in with the entered credentials', async () => {
    (login as jest.Mock).mockResolvedValue({ id: 1, firstName: 'Emily' });
    await render(<LoginScreen />);

    await fireEvent.changeText(screen.getByLabelText('Username'), 'emilys');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'emilyspass');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('emilys', 'emilyspass');
    expect(useAuthStore.getState().status).toBe('unlocked');
  });

  it('shows the error when signing in fails', async () => {
    (login as jest.Mock).mockRejectedValue(appError('invalid-credentials', 'Incorrect username or password.'));
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect username or password.');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
