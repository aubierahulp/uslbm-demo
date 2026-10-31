import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/shared/presentation/components/button';

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button title="Save" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalled();
  });

  it('is disabled and hides its label while loading', async () => {
    const onPress = jest.fn();
    await render(<Button title="Save" onPress={onPress} loading />);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.queryByText('Save')).toBeNull();
  });
});
