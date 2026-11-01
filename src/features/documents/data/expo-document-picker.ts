import * as ExpoDocumentPicker from 'expo-document-picker';

import type { DocumentPicker } from '@/features/documents/domain/document-picker';

export const expoDocumentPicker: DocumentPicker = {
  async pick() {
    // The cache copy is a file:// URI we can read in chunks; the repository deletes it after encrypting.
    const result = await ExpoDocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return null;
    const [asset] = result.assets;
    return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream' };
  },
};
