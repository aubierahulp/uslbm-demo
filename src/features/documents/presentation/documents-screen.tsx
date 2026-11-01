import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { downloadDocument, importDocument, listDocuments, openDocument, runEncryptionBenchmark } from '@/di';
import type { DownloadJob } from '@/features/documents/domain/document-repository';
import type { BenchmarkResult } from '@/features/documents/domain/encryption-benchmark';
import type { TransferProgress, VaultDocument } from '@/features/documents/domain/vault-document';
import { Button } from '@/shared/presentation/components/button';
import { TextField } from '@/shared/presentation/components/text-field';
import { ThemedText } from '@/shared/presentation/components/themed-text';
import { ThemedView } from '@/shared/presentation/components/themed-view';
import { errorMessage } from '@/shared/presentation/error-message';
import { MaxContentWidth, Radius, Spacing } from '@/shared/presentation/theme';
import { useTheme } from '@/shared/presentation/theme/use-theme';

type Task = 'import' | 'download' | 'open' | 'benchmark';

const MB = 1024 * 1024;
const formatBytes = (bytes: number) =>
  bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
const formatTiming = (bytes: number, ms: number) => `${(ms / 1000).toFixed(2)} s (${(bytes / MB / (ms / 1000)).toFixed(0)} MB/s)`;

export function DocumentsScreen() {
  const [documents, setDocuments] = useState<VaultDocument[] | null>(null);
  const [url, setUrl] = useState('');
  const [task, setTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [paused, setPaused] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const download = useRef<DownloadJob | null>(null);

  const reload = useCallback(
    () => listDocuments().then(setDocuments, (e) => setError(errorMessage(e))),
    []
  );
  useEffect(() => {
    reload();
  }, [reload]);

  /** One task at a time; its error replaces the previous one. Fire and forget: failures end up in `error`. */
  function run(next: Task, action: () => Promise<unknown>) {
    setError(null);
    setTask(next);
    action()
      .catch((e) => setError(errorMessage(e)))
      .finally(() => {
        setTask(null);
        setProgress(null);
        setPaused(false);
      });
  }

  const startDownload = () =>
    run('download', async () => {
      const job = downloadDocument(url, setProgress);
      download.current = job;
      try {
        await job.result;
        setUrl('');
        await reload();
      } catch (e) {
        // A cancelled download rejects too; only report failures of the current one.
        if (download.current === job) throw e;
      } finally {
        if (download.current === job) download.current = null;
      }
    });

  async function pauseDownload() {
    await download.current?.pause();
    setPaused(true);
  }

  function resumeDownload() {
    download.current?.resume();
    setPaused(false);
  }

  function cancelDownload() {
    const job = download.current;
    download.current = null;
    job?.cancel();
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={documents ?? []}
        keyExtractor={(doc) => doc.id}
        renderItem={({ item }) => (
          <DocumentListItem document={item} disabled={task !== null} onPress={() => run('open', () => openDocument(item.id))} />
        )}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.section}>
            <Button
              title="Import from device"
              loading={task === 'import'}
              disabled={task !== null}
              onPress={() => run('import', async () => (await importDocument(setProgress)) && reload())}
            />
            <TextField
              label="Download link"
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/spec-sheet.pdf"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={task === null}
            />
            {task === 'download' && progress?.phase === 'downloading' ? (
              <View style={styles.row}>
                <View style={styles.flex}>
                  {paused ? (
                    <Button title="Resume" onPress={resumeDownload} />
                  ) : (
                    <Button title="Pause" variant="secondary" onPress={pauseDownload} />
                  )}
                </View>
                <View style={styles.flex}>
                  <Button title="Cancel" variant="secondary" onPress={cancelDownload} />
                </View>
              </View>
            ) : (
              <Button title="Download" loading={task === 'download'} disabled={task !== null} onPress={startDownload} />
            )}
            {progress && <ProgressBar progress={progress} paused={paused} />}
            {error && (
              <ThemedText themeColor="danger" accessibilityRole="alert">
                {error}
              </ThemedText>
            )}
          </View>
        }
        ListEmptyComponent={
          documents ? (
            <ThemedText themeColor="textSecondary">
              No documents yet. Imports and downloads are encrypted with AES-256-GCM on this device.
            </ThemedText>
          ) : undefined
        }
        ListFooterComponent={
          <View style={styles.section}>
            <Button
              title="Benchmark 100 MB"
              variant="secondary"
              loading={task === 'benchmark'}
              disabled={task !== null}
              onPress={() => run('benchmark', async () => setBenchmark(await runEncryptionBenchmark()))}
            />
            {benchmark && (
              <View>
                <ThemedText type="small">Encrypt: {formatTiming(benchmark.bytes, benchmark.encryptMs)}</ThemedText>
                <ThemedText type="small">Decrypt: {formatTiming(benchmark.bytes, benchmark.decryptMs)}</ThemedText>
              </View>
            )}
          </View>
        }
      />
    </ThemedView>
  );
}

function ProgressBar({ progress, paused }: { progress: TransferProgress; paused: boolean }) {
  const theme = useTheme();
  const { phase, done, total } = progress;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : undefined;
  const verb = paused ? 'Paused' : phase === 'downloading' ? 'Downloading' : 'Encrypting';

  return (
    <View style={styles.progress}>
      <ThemedText type="small" themeColor="textSecondary">
        {verb} {formatBytes(done)}
        {total ? ` of ${formatBytes(total)}` : ''}
      </ThemedText>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={percent === undefined ? undefined : { min: 0, max: 100, now: percent }}
        style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.fill, { width: `${percent ?? 0}%`, backgroundColor: theme.primary }]} />
      </View>
    </View>
  );
}

function DocumentListItem({
  document,
  disabled,
  onPress,
}: {
  document: VaultDocument;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Decrypts and opens the document"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <ThemedText type="defaultBold" numberOfLines={1}>
        {document.name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formatBytes(document.size)} · {document.mimeType}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Added {new Date(document.createdAt).toLocaleString()}
      </ThemedText>
    </Pressable>
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  progress: {
    gap: Spacing.one,
  },
  track: {
    height: Spacing.two,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  item: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Radius.medium,
  },
});
