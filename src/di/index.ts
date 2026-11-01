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
import { expoDocumentPicker } from '@/features/documents/data/expo-document-picker';
import { createQuickCryptoBenchmark } from '@/features/documents/data/quick-crypto-benchmark';
import { createSqliteDocumentRepository } from '@/features/documents/data/sqlite-document-repository';
import { makeDownloadDocument } from '@/features/documents/domain/download-document';
import { makeImportDocument } from '@/features/documents/domain/import-document';
import { makeListDocuments } from '@/features/documents/domain/list-documents';
import { makeOpenDocument } from '@/features/documents/domain/open-document';
import { makeRunEncryptionBenchmark } from '@/features/documents/domain/run-encryption-benchmark';
import { createSqliteRecordRepository } from '@/features/records/data/sqlite-record-repository';
import { makeGetRecord } from '@/features/records/domain/get-record';
import { makeListRecords } from '@/features/records/domain/list-records';
import { makeSaveRecord } from '@/features/records/domain/save-record';
import { expoUpdateRepository } from '@/features/updates/data/expo-update-repository';
import { makeApplyUpdate } from '@/features/updates/domain/apply-update';
import { makeCheckForUpdate } from '@/features/updates/domain/check-for-update';
import { makeGetBuildInfo } from '@/features/updates/domain/get-build-info';
import { createSqlcipherVault } from '@/shared/data/sqlcipher-vault';

const vault = createSqlcipherVault();
const records = createSqliteRecordRepository(vault.getDatabase);
const documents = createSqliteDocumentRepository(vault.getDatabase, vault.getFileKey);

export const login = makeLogin(dummyJsonAuthApi, secureSessionStore, vault);
export const restoreSession = makeRestoreSession(secureSessionStore);
export const unlock = makeUnlock(expoBiometricGate, vault);
export const logout = makeLogout(secureSessionStore, vault);

export const listRecords = makeListRecords(records);
export const getRecord = makeGetRecord(records);
export const saveRecord = makeSaveRecord(records);

export const listDocuments = makeListDocuments(documents);
export const importDocument = makeImportDocument(expoDocumentPicker, documents);
export const downloadDocument = makeDownloadDocument(documents);
export const openDocument = makeOpenDocument(documents);
export const runEncryptionBenchmark = makeRunEncryptionBenchmark(createQuickCryptoBenchmark(vault.getFileKey));

export const getBuildInfo = makeGetBuildInfo(expoUpdateRepository);
export const checkForUpdate = makeCheckForUpdate(expoUpdateRepository);
export const applyUpdate = makeApplyUpdate(expoUpdateRepository);
