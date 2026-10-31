import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getRecord, saveRecord } from '@/di';
import { RecordFormScreen } from '@/features/records/presentation/record-form-screen';
import { appError } from '@/shared/domain/app-error';

jest.mock('@/di', () => ({ getRecord: jest.fn(), saveRecord: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const params = useLocalSearchParams as jest.Mock;

describe('RecordFormScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a record and goes back', async () => {
    params.mockReturnValue({});
    (saveRecord as jest.Mock).mockResolvedValue({});
    await render(<RecordFormScreen />);

    await fireEvent.changeText(screen.getByLabelText('Title'), 'Roof inspection');
    await fireEvent.changeText(screen.getByLabelText('Notes'), 'North side');
    await fireEvent.press(screen.getByRole('radio', { name: 'Done' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(saveRecord).toHaveBeenCalledWith({ title: 'Roof inspection', notes: 'North side', status: 'done' }, undefined);
  });

  it('loads an existing record and saves it under its id', async () => {
    params.mockReturnValue({ id: 'r1' });
    (getRecord as jest.Mock).mockResolvedValue({ id: 'r1', title: 'Roof', notes: '', status: 'in_progress' });
    (saveRecord as jest.Mock).mockResolvedValue({});
    await render(<RecordFormScreen />);

    expect(await screen.findByDisplayValue('Roof')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(saveRecord).toHaveBeenCalledWith({ title: 'Roof', notes: '', status: 'in_progress' }, 'r1')
    );
  });

  it('shows validation errors and stays on the screen', async () => {
    params.mockReturnValue({});
    (saveRecord as jest.Mock).mockRejectedValue(appError('validation', 'Title is required.'));
    await render(<RecordFormScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required.');
    expect(router.back).not.toHaveBeenCalled();
  });
});
