import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/presentation/auth-store';
import { useColorScheme } from '@/shared/presentation/theme/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const status = useAuthStore((state) => state.status);
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    restore()
      .catch(console.error)
      .finally(() => SplashScreen.hide());
  }, [restore]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* The splash screen covers the login route while the session is restored. */}
        <Stack.Protected guard={status === 'signed-out' || status === 'restoring'}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'locked'}>
          <Stack.Screen name="unlock" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'unlocked'}>
          <Stack.Screen name="index" options={{ title: 'Field Vault' }} />
          <Stack.Screen name="records/new" options={{ title: 'New record' }} />
          <Stack.Screen name="records/[id]" options={{ title: 'Edit record' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
