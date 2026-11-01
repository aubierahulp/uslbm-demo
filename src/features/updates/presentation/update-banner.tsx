import { useEffect, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';

import { applyUpdate, checkForUpdate } from '@/di';
import { Button } from '@/shared/presentation/components/button';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { errorMessage } from '@/shared/presentation/error-message';
import { Radius, Spacing } from '@/shared/presentation/theme';

/** Checks on mount and whenever the app comes back to the foreground; field users rarely cold-start. */
export function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let checking = false;
    const check = () => {
      if (checking) return;
      checking = true;
      checkForUpdate()
        .then((isReady) => isReady && setReady(true))
        // Being offline is normal in the field; the next foreground tries again.
        .catch(() => {})
        .finally(() => (checking = false));
    };
    check();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => subscription.remove();
  }, []);

  async function restart() {
    setRestarting(true);
    try {
      await applyUpdate();
    } catch (e) {
      setError(errorMessage(e));
      setRestarting(false);
    }
  }

  if (!ready) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.banner}>
      <ThemedText type="defaultBold">Update available</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Restart to use the new version. You will unlock the app again.
      </ThemedText>
      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      )}
      <Button title="Restart" onPress={restart} loading={restarting} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Radius.medium,
  },
});
