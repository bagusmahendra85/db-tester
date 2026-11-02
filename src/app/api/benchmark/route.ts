import { NextRequest, NextResponse } from 'next/server';
import { BenchmarkRequest } from '@/lib/types';
import { runBenchmark } from '@/lib/benchmark-service';

export async function POST(req: NextRequest) {
  try {
    const { config, concurrency = 5, iterations = 20, query }: BenchmarkRequest = await req.json();

    if (!config?.host || !config?.port || !config?.user) {
      return NextResponse.json(
        { success: false, errorSample: 'Konfigurasi koneksi belum lengkap.' },
        { status: 400 }
      );
    }

    const safeConcurrency = Math.min(Math.max(1, concurrency), 20);
    const safeIterations = Math.min(Math.max(1, iterations), 200);

    const result = await runBenchmark(config, safeConcurrency, safeIterations, query);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTimeMs: 0,
        requestsPerSecond: 0,
        latencies: { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p99: 0 },
        errorSample: errorMsg,
      },
      { status: 500 }
    );
  }
}
