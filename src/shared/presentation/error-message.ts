import { isAppError } from '@/shared/domain/app-error';

/** Domain errors carry user-facing messages; anything else is logged and gets a generic one. */
export function errorMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  console.error(error);
  return 'Something went wrong. Please try again.';
}
