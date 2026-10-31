import type { AuthApi } from '@/features/auth/domain/auth-api';
import { appError } from '@/shared/domain/app-error';

const BASE_URL = 'https://dummyjson.com';

type LoginResponse = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken: string;
};

export const dummyJsonAuthApi: AuthApi = {
  async login(username, password) {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, expiresInMins: 60 }),
      });
    } catch {
      throw appError('network', 'No connection. Check your network and try again.');
    }

    if (response.status === 400 || response.status === 401) {
      throw appError('invalid-credentials', 'Incorrect username or password.');
    }
    if (!response.ok) throw appError('network', `Sign-in failed (${response.status}). Try again.`);

    const dto: LoginResponse = await response.json();
    return {
      user: {
        id: dto.id,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      },
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
    };
  },
};
