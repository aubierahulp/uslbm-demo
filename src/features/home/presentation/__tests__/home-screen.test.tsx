import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { router } from 'expo-router';

import { listRecords, logout } from '@/di';
import { useAuthStore } from '@/features/auth/presentation/auth-store';
import { HomeScreen } from '@/features/home/presentation/home-screen';
import { appError } from '@/shared/domain/app-error';

jest.mock('@/di', () => ({
  listRecords: jest.fn(),
  logout: jest.fn(),
  getBuildInfo: () => ({ appVersion: '1.0.0', runtimeVersion: 'rt', channel: 'preview', updateId: null }),
}));
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    router: { push: jest.fn() },
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
    Link: ({ children }: { children: ReactNode }) => children,
  };
});

const user = { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'emily@x.com' };
const record = { id: 'r1', title: 'Roof inspection', notes: 'North side', status: 'done', createdAt: 1, updatedAt: 2 };

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ status: 'unlocked', user });
  });

  it('greets the user and lists their records', async () => {
    (listRecords as jest.Mock).mockResolvedValue([record]);
    await render(<HomeScreen />);

    expect(screen.getByText('Hi Emily')).toBeOnTheScreen();
    expect(await screen.findByText('Roof inspection')).toBeOnTheScreen();
    expect(screen.getByText('Done')).toBeOnTheScreen();
    expect(screen.getByText('Build')).toBeOnTheScreen();
  });

  it('shows an empty state', async () => {
    (listRecords as jest.Mock).mockResolvedValue([]);
    await render(<HomeScreen />);

    expect(await screen.findByText(/No records yet/)).toBeOnTheScreen();
  });

  it('shows an error when records cannot be loaded', async () => {
    (listRecords as jest.Mock).mockRejectedValue(appError('vault-locked', 'Unlock the app to see your data.'));
    await render(<HomeScreen />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unlock the app to see your data.');
  });

  it('opens the new record form and documents, and signs out', async () => {
    (listRecords as jest.Mock).mockResolvedValue([]);
    (logout as jest.Mock).mockResolvedValue(undefined);
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'New record' }));
    expect(router.push).toHaveBeenCalledWith('/records/new');

    await fireEvent.press(screen.getByRole('button', { name: 'Documents' }));
    expect(router.push).toHaveBeenCalledWith('/documents');

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    expect(useAuthStore.getState().status).toBe('signed-out');
  });
});
