import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/presentation/auth-store';
import { Button } from '@/shared/presentation/components/button';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { errorMessage } from '@/shared/presentation/error-message';
import { MaxContentWidth, Spacing } from '@/shared/presentation/theme';

export function UnlockScreen() {
  const user = useAuthStore((state) => state.user);
  const unlock = useAuthStore((state) => state.unlock);
  const logout = useAuthStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title">Welcome back{user ? `, ${user.firstName}` : ''}</ThemedText>
        <ThemedText themeColor="textSecondary">Your vault is locked. Unlock it with biometrics or your device passcode.</ThemedText>

        {error && (
          <ThemedText themeColor="danger" accessibilityRole="alert">
            {error}
          </ThemedText>
        )}
        <Button title="Unlock" onPress={() => run(unlock)} loading={busy} />
        <Button title="Sign out" variant="secondary" onPress={() => run(logout)} disabled={busy} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
