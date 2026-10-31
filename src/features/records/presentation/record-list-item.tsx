import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { FieldRecord } from '@/features/records/domain/field-record';
import { STATUS_LABELS } from '@/features/records/presentation/status-labels';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { Radius, Spacing } from '@/shared/presentation/theme';
import { useTheme } from '@/shared/presentation/theme/use-theme';

export function RecordListItem({ record }: { record: FieldRecord }) {
  const theme = useTheme();

  return (
    <Link href={{ pathname: '/records/[id]', params: { id: record.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.item,
          { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
        ]}>
        <View style={styles.header}>
          <ThemedText type="defaultBold" numberOfLines={1} style={styles.title}>
            {record.title}
          </ThemedText>
          <ThemedText type="small" themeColor={record.status === 'done' ? 'success' : 'textSecondary'}>
            {STATUS_LABELS[record.status]}
          </ThemedText>
        </View>
        {record.notes ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {record.notes}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          Updated {new Date(record.updatedAt).toLocaleString()}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Radius.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
});
