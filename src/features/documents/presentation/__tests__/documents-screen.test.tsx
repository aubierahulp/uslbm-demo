import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { downloadDocument, importDocument, listDocuments, openDocument, runEncryptionBenchmark } from '@/di';
import type { OnProgress } from '@/features/documents/domain/vault-document';
import { DocumentsScreen } from '@/features/documents/presentation/documents-screen';
import { appError } from '@/shared/domain/app-error';

jest.mock('@/di', () => ({
  listDocuments: jest.fn(),
  importDocument: jest.fn(),
  downloadDocument: jest.fn(),
  openDocument: jest.fn(),
  runEncryptionBenchmark: jest.fn(),
}));

const doc = {
  id: 'd1',
  name: 'Spec sheet.pdf',
  mimeType: 'application/pdf',
  size: 5 * 1024 * 1024,
  sha256: 'hash',
  createdAt: 1,
};

/** A download job the test drives by hand. */
function fakeJob() {
  let progress!: OnProgress;
  let settle!: { resolve: (value: unknown) => void; reject: (error: unknown) => void };
  const job = {
    result: new Promise((resolve, reject) => (settle = { resolve, reject })),
    pause: jest.fn(async () => {}),
    resume: jest.fn(),
    cancel: jest.fn(() => settle.reject(new Error('cancelled'))),
  };
  (downloadDocument as jest.Mock).mockImplementation((_url: string, onProgress: OnProgress) => {
    progress = onProgress;
    return job;
  });
  return { job, settle, report: (...args: Parameters<OnProgress>) => act(() => progress(...args)) };
}

describe('DocumentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (listDocuments as jest.Mock).mockResolvedValue([doc]);
  });

  it('lists encrypted documents with their size and type', async () => {
    await render(<DocumentsScreen />);

    expect(await screen.findByText('Spec sheet.pdf')).toBeOnTheScreen();
    expect(screen.getByText('5.0 MB · application/pdf')).toBeOnTheScreen();
  });

  it('shows an empty state', async () => {
    (listDocuments as jest.Mock).mockResolvedValue([]);
    await render(<DocumentsScreen />);

    expect(await screen.findByText(/No documents yet/)).toBeOnTheScreen();
  });

  it('imports a document, showing encryption progress, then reloads the list', async () => {
    let finish!: () => void;
    (importDocument as jest.Mock).mockImplementation(async (onProgress: OnProgress) => {
      onProgress({ phase: 'encrypting', done: MB(1), total: MB(4) });
      await new Promise<void>((resolve) => (finish = resolve));
      return doc;
    });
    await render(<DocumentsScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Import from device' }));

    expect(await screen.findByText('Encrypting 1.0 MB of 4.0 MB')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 25 });
    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen());
    expect(listDocuments).toHaveBeenCalledTimes(2);
  });

  it('shows a validation error for a bad link', async () => {
    (downloadDocument as jest.Mock).mockImplementation(() => {
      throw appError('validation', 'Enter a valid https:// link.');
    });
    await render(<DocumentsScreen />);

    await fireEvent.changeText(screen.getByLabelText('Download link'), 'http://example.com/a.pdf');
    await fireEvent.press(screen.getByRole('button', { name: 'Download' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid https:// link.');
    expect(downloadDocument).toHaveBeenCalledWith('http://example.com/a.pdf', expect.any(Function));
  });

  it('downloads with progress, pause and resume, then reloads', async () => {
    const { job, settle, report } = fakeJob();
    await render(<DocumentsScreen />);

    await fireEvent.changeText(screen.getByLabelText('Download link'), 'https://example.com/a.pdf');
    await fireEvent.press(screen.getByRole('button', { name: 'Download' }));
    await report({ phase: 'downloading', done: MB(2), total: null });
    expect(screen.getByText('Downloading 2.0 MB')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(job.pause).toHaveBeenCalled();
    expect(await screen.findByText('Paused 2.0 MB')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Resume' }));
    expect(job.resume).toHaveBeenCalled();

    await act(async () => settle.resolve(doc));
    await waitFor(() => expect(screen.getByLabelText('Download link')).toHaveDisplayValue(''));
    expect(listDocuments).toHaveBeenCalledTimes(2);
  });

  it('cancels a download without showing an error', async () => {
    const { job, report } = fakeJob();
    await render(<DocumentsScreen />);

    await fireEvent.changeText(screen.getByLabelText('Download link'), 'https://example.com/a.pdf');
    await fireEvent.press(screen.getByRole('button', { name: 'Download' }));
    await report({ phase: 'downloading', done: 10, total: 100 });
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(job.cancel).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Download' })).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it('reports a failed download', async () => {
    const { settle, report } = fakeJob();
    await render(<DocumentsScreen />);

    await fireEvent.changeText(screen.getByLabelText('Download link'), 'https://example.com/a.pdf');
    await fireEvent.press(screen.getByRole('button', { name: 'Download' }));
    await report({ phase: 'downloading', done: 10, total: 100 });
    await act(async () => settle.reject(appError('network', 'The download failed.')));

    expect(await screen.findByRole('alert')).toHaveTextContent('The download failed.');
  });

  it('opens a document, and shows why it could not be opened', async () => {
    (openDocument as jest.Mock).mockRejectedValue(appError('tampered', 'This document is damaged or has been tampered with.'));
    await render(<DocumentsScreen />);

    await fireEvent.press(await screen.findByText('Spec sheet.pdf'));

    expect(openDocument).toHaveBeenCalledWith('d1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/tampered with/);
  });

  it('runs the benchmark and shows timings', async () => {
    (runEncryptionBenchmark as jest.Mock).mockResolvedValue({ bytes: MB(100), encryptMs: 2000, decryptMs: 1000 });
    await render(<DocumentsScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Benchmark 100 MB' }));

    expect(await screen.findByText('Encrypt: 2.00 s (50 MB/s)')).toBeOnTheScreen();
    expect(screen.getByText('Decrypt: 1.00 s (100 MB/s)')).toBeOnTheScreen();
  });
});

function MB(n: number) {
  return n * 1024 * 1024;
}
