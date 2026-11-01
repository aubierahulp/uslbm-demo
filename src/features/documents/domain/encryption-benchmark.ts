export const BENCHMARK_BYTES = 100 * 1024 * 1024;

export type BenchmarkResult = { bytes: number; encryptMs: number; decryptMs: number };

/** Times file encryption and decryption on this device. */
export interface EncryptionBenchmark {
  run(bytes: number): Promise<BenchmarkResult>;
}
