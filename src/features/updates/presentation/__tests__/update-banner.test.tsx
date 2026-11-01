import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { applyUpdate, checkForUpdate } from '@/di';
import { UpdateBanner } from '@/features/updates/presentation/update-banner';

jest.mock('@/di', () => ({ checkForUpdate: jest.fn(), applyUpdate: jest.fn() }));

const check = checkForUpdate as jest.Mock;

function captureAppState() {
  let listener!: (state: string) => void;
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    listener = handler as (state: string) => void;
    return { remove };
  });
  return { setState: (state: string) => act(async () => listener(state)), remove };
}

describe('UpdateBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stays hidden when no update is ready', async () => {
    check.mockResolvedValue(false);
    await render(<UpdateBanner />);

    expect(check).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Update available')).not.toBeOnTheScreen();
  });

  it('stays hidden when the check fails, e.g. offline', async () => {
    check.mockRejectedValue(new Error('Network request failed'));
    await render(<UpdateBanner />);

    expect(screen.queryByText('Update available')).not.toBeOnTheScreen();
  });

  it('checks again when the app returns to the foreground, and stops listening on unmount', async () => {
    const appState = captureAppState();
    check.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { unmount } = await render(<UpdateBanner />);

    await appState.setState('background');
    expect(check).toHaveBeenCalledTimes(1);
    await appState.setState('active');

    expect(await screen.findByText('Update available')).toBeOnTheScreen();
    expect(check).toHaveBeenCalledTimes(2);
    await unmount();
    expect(appState.remove).toHaveBeenCalled();
  });

  it('restarts into the update', async () => {
    check.mockResolvedValue(true);
    (applyUpdate as jest.Mock).mockResolvedValue(undefined);
    await render(<UpdateBanner />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Restart' }));
    expect(applyUpdate).toHaveBeenCalled();
  });

  it('shows an error when the restart fails', async () => {
    check.mockResolvedValue(true);
    (applyUpdate as jest.Mock).mockRejectedValue(new Error('no runtime'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await render(<UpdateBanner />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Restart' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
  });
});
