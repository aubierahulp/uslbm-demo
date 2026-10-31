import type { Session } from '@/features/auth/domain/session';

export interface AuthApi {
  /** Throws AppError 'invalid-credentials' or 'network'. */
  login(username: string, password: string): Promise<Session>;
}
