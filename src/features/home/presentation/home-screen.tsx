import { ScrollView, StyleSheet } from 'react-native';

import { BuildInfoCard } from '@/features/updates/presentation/build-info-card';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { MaxContentWidth, Spacing } from '@/shared/presentation/theme';

export function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Field Vault</ThemedText>
        <ThemedText themeColor="textSecondary">
          Offline, encrypted document vault for field teams.
        </ThemedText>
        <BuildInfoCard />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
