import { appError, isAppError } from '@/shared/domain/app-error';

describe('appError', () => {
  it('creates an Error carrying a code and message', () => {
    const error = appError('validation', 'Title is required.');

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('validation');
    expect(error.message).toBe('Title is required.');
    expect(isAppError(error)).toBe(true);
  });

  it('does not treat other errors as AppError', () => {
    expect(isAppError(new Error('boom'))).toBe(false);
    expect(isAppError('validation')).toBe(false);
  });
});
