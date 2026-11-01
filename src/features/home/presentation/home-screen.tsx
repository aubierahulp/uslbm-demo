import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/features/auth/presentation/auth-store';
import { RecordListItem } from '@/features/records/presentation/record-list-item';
import { useRecords } from '@/features/records/presentation/use-records';
import { BuildInfoCard } from '@/features/updates/presentation/build-info-card';
import { UpdateBanner } from '@/features/updates/presentation/update-banner';
import { Button } from '@/shared/presentation/components/button';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { MaxContentWidth, Spacing } from '@/shared/presentation/theme';

export function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { records, error } = useRecords();

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={records ?? []}
        keyExtractor={(record) => record.id}
        renderItem={({ item }) => <RecordListItem record={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.section}>
            <UpdateBanner />
            <ThemedText type="subtitle">Hi {user?.firstName}</ThemedText>
            <Button title="New record" onPress={() => router.push('/records/new')} />
            <Button title="Documents" variant="secondary" onPress={() => router.push('/documents')} />
            {error && (
              <ThemedText themeColor="danger" accessibilityRole="alert">
                {error}
              </ThemedText>
            )}
          </View>
        }
        ListEmptyComponent={
          records ? (
            <ThemedText themeColor="textSecondary">No records yet. They are stored encrypted on this device.</ThemedText>
          ) : undefined
        }
        ListFooterComponent={
          <View style={styles.section}>
            <BuildInfoCard />
            <Button title="Sign out" variant="secondary" onPress={logout} />
          </View>
        }
      />
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
  section: {
    gap: Spacing.three,
  },
});
