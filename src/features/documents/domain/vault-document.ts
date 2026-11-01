import { appError } from '@/shared/domain/app-error';

/** A document stored encrypted on the device. `size` and `sha256` describe the plaintext. */
export type VaultDocument = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  sha256: string;
  createdAt: number;
};

/** A plaintext file chosen on the device, waiting to be encrypted into the vault. */
export type PickedFile = { uri: string; name: string; mimeType: string };

/** `total` is null when the server does not send a Content-Length. */
export type TransferProgress = { phase: 'downloading' | 'encrypting'; done: number; total: number | null };
export type OnProgress = (progress: TransferProgress) => void;

/** Only https: documents travel over the network encrypted until they reach the vault. */
export function validateDownloadUrl(url: string): string {
  const trimmed = url.trim();
  if (!/^https:\/\/[^\s/?#]+\.[^\s/?#]+([/?#]\S*)?$/i.test(trimmed)) {
    throw appError('validation', 'Enter a valid https:// link.');
  }
  return trimmed;
}
