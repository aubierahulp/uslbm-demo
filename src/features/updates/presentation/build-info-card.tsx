import { StyleSheet, View } from 'react-native';

import { getBuildInfo } from '@/di';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { Radius, Spacing } from '@/shared/presentation/theme';

export function BuildInfoCard() {
  const info = getBuildInfo();
  const rows: [string, string][] = [
    ['App version', info.appVersion ?? '-'],
    ['Runtime version', info.runtimeVersion ?? '-'],
    ['Channel', info.channel ?? '-'],
    ['Update ID', info.updateId ?? 'embedded'],
  ];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="subtitle">Build</ThemedText>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            {label}
          </ThemedText>
          <ThemedText type="code" selectable>
            {value}
          </ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Radius.medium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
