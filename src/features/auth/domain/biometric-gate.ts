/** 'unavailable' means the device has no biometrics or passcode set up. */
export type BiometricResult = 'success' | 'cancelled' | 'unavailable';

export interface BiometricGate {
  authenticate(prompt: string): Promise<BiometricResult>;
}
