import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getRecord, saveRecord } from '@/di';
import { RECORD_STATUSES, TITLE_MAX_LENGTH, type RecordStatus } from '@/features/records/domain/field-record';
import { STATUS_LABELS } from '@/features/records/presentation/status-labels';
import { Button } from '@/shared/presentation/components/button';
import { TextField } from '@/shared/presentation/components/text-field';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { errorMessage } from '@/shared/presentation/error-message';
import { MaxContentWidth, Radius, Spacing } from '@/shared/presentation/theme';
import { useTheme } from '@/shared/presentation/theme/use-theme';

/** Creates a record, or edits one when the route has an `id` param. */
export function RecordFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<RecordStatus>('draft');
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getRecord(id).then(
      (record) => {
        if (!active) return;
        setTitle(record.title);
        setNotes(record.notes);
        setStatus(record.status);
        setLoading(false);
      },
      (e) => active && setError(errorMessage(e))
    );
    return () => {
      active = false;
    };
  }, [id]);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await saveRecord({ title, notes, status }, id);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField label="Title" value={title} onChangeText={setTitle} maxLength={TITLE_MAX_LENGTH} editable={!loading} />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.notes}
            textAlignVertical="top"
            editable={!loading}
          />
          <StatusPicker value={status} onChange={setStatus} />

          {error && (
            <ThemedText themeColor="danger" accessibilityRole="alert">
              {error}
            </ThemedText>
          )}
          <Button title="Save" onPress={save} loading={saving} disabled={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function StatusPicker({ value, onChange }: { value: RecordStatus; onChange: (status: RecordStatus) => void }) {
  const theme = useTheme();

  return (
    <View style={styles.statusGroup}>
      <ThemedText type="smallBold">Status</ThemedText>
      <View style={styles.statusRow} accessibilityRole="radiogroup">
        {RECORD_STATUSES.map((status) => {
          const selected = status === value;
          return (
            <Pressable
              key={status}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(status)}
              style={[
                styles.statusOption,
                { backgroundColor: selected ? theme.primary : theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
                {STATUS_LABELS[status]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  notes: {
    minHeight: 120,
  },
  statusGroup: {
    gap: Spacing.one,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusOption: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
});
