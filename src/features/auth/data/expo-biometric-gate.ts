import * as LocalAuthentication from 'expo-local-authentication';

import type { BiometricGate } from '@/features/auth/domain/biometric-gate';

const UNAVAILABLE_ERRORS = ['not_enrolled', 'not_available', 'passcode_not_set'];

// ponytail: app-level gate; the master key itself is not bound to biometrics.
// Upgrade path: SecureStore requireAuthentication (key lost when biometrics change).
export const expoBiometricGate: BiometricGate = {
  async authenticate(promptMessage) {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) return 'unavailable';

    // Device passcode fallback stays enabled, so users without biometrics can still unlock.
    const result = await LocalAuthentication.authenticateAsync({ promptMessage });
    if (result.success) return 'success';
    return UNAVAILABLE_ERRORS.includes(result.error) ? 'unavailable' : 'cancelled';
  },
};
