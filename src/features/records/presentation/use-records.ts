import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listRecords } from '@/di';
import type { FieldRecord } from '@/features/records/domain/field-record';
import { errorMessage } from '@/shared/presentation/error-message';

/** Reloads every time the screen gains focus, so edits show up after going back. */
export function useRecords() {
  const [records, setRecords] = useState<FieldRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listRecords().then(
        (result) => {
          if (!active) return;
          setRecords(result);
          setError(null);
        },
        (e) => active && setError(errorMessage(e))
      );
      return () => {
        active = false;
      };
    }, [])
  );

  return { records, error };
}
