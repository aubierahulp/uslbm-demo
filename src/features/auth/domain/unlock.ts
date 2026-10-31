import type { BiometricGate } from '@/features/auth/domain/biometric-gate';
import { appError } from '@/shared/domain/app-error';
import type { DataVault } from '@/shared/domain/data-vault';

export const makeUnlock = (gate: BiometricGate, vault: DataVault) => async (): Promise<void> => {
  const result = await gate.authenticate('Unlock Field Vault');
  if (result === 'unavailable') {
    throw appError('biometrics-unavailable', 'Set up a screen lock or biometrics on this device to use Field Vault.');
  }
  if (result === 'cancelled') throw appError('unlock-cancelled', 'Unlock was cancelled. Try again.');
  await vault.open();
};
