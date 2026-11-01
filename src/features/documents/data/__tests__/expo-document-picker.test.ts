import * as ExpoDocumentPicker from 'expo-document-picker';

import { expoDocumentPicker } from '@/features/documents/data/expo-document-picker';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

const getDocument = ExpoDocumentPicker.getDocumentAsync as jest.Mock;

describe('expoDocumentPicker', () => {
  it('copies the pick to the cache and maps it to a picked file', async () => {
    getDocument.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/spec.pdf', name: 'spec.pdf', mimeType: 'application/pdf', size: 10 }],
    });

    await expect(expoDocumentPicker.pick()).resolves.toEqual({
      uri: 'file:///cache/spec.pdf',
      name: 'spec.pdf',
      mimeType: 'application/pdf',
    });
    expect(getDocument).toHaveBeenCalledWith({ copyToCacheDirectory: true });
  });

  it('falls back to a generic MIME type', async () => {
    getDocument.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/x', name: 'x' }] });

    await expect(expoDocumentPicker.pick()).resolves.toMatchObject({ mimeType: 'application/octet-stream' });
  });

  it('returns null when the user cancels', async () => {
    getDocument.mockResolvedValue({ canceled: true, assets: null });

    await expect(expoDocumentPicker.pick()).resolves.toBeNull();
  });
});
