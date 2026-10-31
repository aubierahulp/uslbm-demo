import { appError } from '@/shared/domain/app-error';
import { errorMessage } from '@/shared/presentation/error-message';

describe('errorMessage', () => {
  it('shows the message of a domain error', () => {
    expect(errorMessage(appError('network', 'No connection.'))).toBe('No connection.');
  });

  it('hides unexpected errors behind a generic message', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(errorMessage(new Error('SQLITE_CORRUPT'))).toBe('Something went wrong. Please try again.');
  });
});
