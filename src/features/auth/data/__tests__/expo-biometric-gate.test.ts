import * as LocalAuthentication from 'expo-local-authentication';

import { expoBiometricGate } from '@/features/auth/data/expo-biometric-gate';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const enrolledLevel = LocalAuthentication.getEnrolledLevelAsync as jest.Mock;
const authenticate = LocalAuthentication.authenticateAsync as jest.Mock;

describe('expoBiometricGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    enrolledLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG);
  });

  it('is unavailable without any biometrics or passcode, and does not prompt', async () => {
    enrolledLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);

    await expect(expoBiometricGate.authenticate('Unlock')).resolves.toBe('unavailable');
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('succeeds when the user authenticates', async () => {
    authenticate.mockResolvedValue({ success: true });

    await expect(expoBiometricGate.authenticate('Unlock')).resolves.toBe('success');
    expect(authenticate).toHaveBeenCalledWith({ promptMessage: 'Unlock' });
  });

  it.each(['user_cancel', 'lockout', 'authentication_failed'])('treats %s as cancelled', async (error) => {
    authenticate.mockResolvedValue({ success: false, error });
    await expect(expoBiometricGate.authenticate('Unlock')).resolves.toBe('cancelled');
  });

  it.each(['not_enrolled', 'passcode_not_set'])('treats %s as unavailable', async (error) => {
    authenticate.mockResolvedValue({ success: false, error });
    await expect(expoBiometricGate.authenticate('Unlock')).resolves.toBe('unavailable');
  });
});
