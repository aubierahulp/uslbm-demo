/**
 * Composition root: the only place where data implementations meet domain use cases.
 * Presentation imports the wired use cases from here. See docs/clean-architecture.md.
 */
import { dummyJsonAuthApi } from '@/features/auth/data/dummyjson-auth-api';
import { expoBiometricGate } from '@/features/auth/data/expo-biometric-gate';
import { secureSessionStore } from '@/features/auth/data/secure-session-store';
import { makeLogin } from '@/features/auth/domain/login';
import { makeLogout } from '@/features/auth/domain/logout';
import { makeRestoreSession } from '@/features/auth/domain/restore-session';
import { makeUnlock } from '@/features/auth/domain/unlock';
import { createSqliteRecordRepository } from '@/features/records/data/sqlite-record-repository';
import { makeGetRecord } from '@/features/records/domain/get-record';
import { makeListRecords } from '@/features/records/domain/list-records';
import { makeSaveRecord } from '@/features/records/domain/save-record';
import { expoUpdateRepository } from '@/features/updates/data/expo-update-repository';
import { makeGetBuildInfo } from '@/features/updates/domain/get-build-info';
import { createSqlcipherVault } from '@/shared/data/sqlcipher-vault';

const vault = createSqlcipherVault();
const records = createSqliteRecordRepository(vault.getDatabase);

export const login = makeLogin(dummyJsonAuthApi, secureSessionStore, vault);
export const restoreSession = makeRestoreSession(secureSessionStore);
export const unlock = makeUnlock(expoBiometricGate, vault);
export const logout = makeLogout(secureSessionStore, vault);

export const listRecords = makeListRecords(records);
export const getRecord = makeGetRecord(records);
export const saveRecord = makeSaveRecord(records);

export const getBuildInfo = makeGetBuildInfo(expoUpdateRepository);
