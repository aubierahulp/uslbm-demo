import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/presentation/auth-store';
import { Button } from '@/shared/presentation/components/button';
import { TextField } from '@/shared/presentation/components/text-field';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { errorMessage } from '@/shared/presentation/error-message';
import { MaxContentWidth, Spacing } from '@/shared/presentation/theme';

export function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (e) {
      setError(errorMessage(e));
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="title">Field Vault</ThemedText>
            <ThemedText themeColor="textSecondary">Sign in to open your encrypted vault.</ThemedText>

            <TextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={submit}
            />

            {error && (
              <ThemedText themeColor="danger" accessibilityRole="alert">
                {error}
              </ThemedText>
            )}
            <Button title="Sign in" onPress={submit} loading={submitting} />
            <ThemedText type="small" themeColor="textSecondary">
              Demo account: emilys / emilyspass
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
