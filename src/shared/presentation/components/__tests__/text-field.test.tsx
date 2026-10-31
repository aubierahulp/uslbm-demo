import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from '@/shared/presentation/components/text-field';

describe('TextField', () => {
  it('is labelled and reports changes', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Title" value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText('Title'), 'Roof inspection');

    expect(onChangeText).toHaveBeenCalledWith('Roof inspection');
  });
});
