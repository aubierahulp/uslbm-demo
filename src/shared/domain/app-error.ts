export type AppErrorCode =
  | 'validation'
  | 'invalid-credentials'
  | 'network'
  | 'unlock-cancelled'
  | 'biometrics-unavailable'
  | 'vault-locked'
  | 'not-found'
  | 'tampered'
  | 'unsupported';

/** Errors the domain knows about. `message` is safe to show to the user. */
export type AppError = Error & { code: AppErrorCode };

export const appError = (code: AppErrorCode, message: string): AppError =>
  Object.assign(new Error(message), { code });

export const isAppError = (error: unknown): error is AppError =>
  error instanceof Error && typeof (error as Partial<AppError>).code === 'string';
