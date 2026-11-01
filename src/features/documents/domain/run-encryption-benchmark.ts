import {
  BENCHMARK_BYTES,
  type BenchmarkResult,
  type EncryptionBenchmark,
} from '@/features/documents/domain/encryption-benchmark';

export const makeRunEncryptionBenchmark = (benchmark: EncryptionBenchmark) => (): Promise<BenchmarkResult> =>
  benchmark.run(BENCHMARK_BYTES);
