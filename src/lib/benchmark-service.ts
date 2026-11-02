import { ConnectionConfig, BenchmarkResult } from './types';
import { executeMySQLQuery } from './mysql-service';
import { executePostgresQuery } from './postgres-service';

export async function runBenchmark(
  config: ConnectionConfig,
  concurrency = 5,
  iterations = 20,
  query?: string
): Promise<BenchmarkResult> {
  const targetQuery = query && query.trim() ? query : 'SELECT 1';
  const totalRequests = iterations;
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  let errorSample: string | undefined;

  const benchmarkStart = performance.now();

  // Execute in batches based on concurrency
  const runSingle = async () => {
    const start = performance.now();
    try {
      const res =
        config.type === 'mysql'
          ? await executeMySQLQuery(config, targetQuery, 1)
          : await executePostgresQuery(config, targetQuery, 1);

      const duration = performance.now() - start;
      if (res.success) {
        successfulRequests++;
        latencies.push(duration);
      } else {
        failedRequests++;
        if (!errorSample && res.error) errorSample = res.error;
      }
    } catch (err) {
      failedRequests++;
      if (!errorSample) errorSample = err instanceof Error ? err.message : String(err);
    }
  };

  // Queue of promises
  const taskQueue: (() => Promise<void>)[] = [];
  for (let i = 0; i < totalRequests; i++) {
    taskQueue.push(runSingle);
  }

  // Worker pool for concurrency
  const activeWorkers: Promise<void>[] = [];
  for (let c = 0; c < concurrency; c++) {
    const worker = async () => {
      while (taskQueue.length > 0) {
        const task = taskQueue.shift();
        if (task) {
          await task();
        }
      }
    };
    activeWorkers.push(worker());
  }

  await Promise.all(activeWorkers);

  const totalTimeMs = Math.round(performance.now() - benchmarkStart);
  latencies.sort((a, b) => a - b);

  const getPercentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return Math.round(arr[Math.max(0, Math.min(index, arr.length - 1))] * 100) / 100;
  };

  const avg =
    latencies.length > 0
      ? Math.round((latencies.reduce((sum, val) => sum + val, 0) / latencies.length) * 100) / 100
      : 0;

  const requestsPerSecond =
    totalTimeMs > 0 ? Math.round((successfulRequests / (totalTimeMs / 1000)) * 100) / 100 : 0;

  return {
    success: successfulRequests > 0,
    totalRequests,
    successfulRequests,
    failedRequests,
    totalTimeMs,
    requestsPerSecond,
    latencies: {
      min: latencies.length > 0 ? Math.round(latencies[0] * 100) / 100 : 0,
      max: latencies.length > 0 ? Math.round(latencies[latencies.length - 1] * 100) / 100 : 0,
      avg,
      p50: getPercentile(latencies, 50),
      p90: getPercentile(latencies, 90),
      p99: getPercentile(latencies, 99),
    },
    errorSample,
  };
}

