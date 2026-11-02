'use client';

import React, { useState } from 'react';
import { ConnectionConfig, BenchmarkResult } from '@/lib/types';
import { Zap, Play, CheckCircle2, XCircle, Gauge, Activity } from 'lucide-react';

interface Props {
  config: ConnectionConfig;
}

export const BenchmarkView: React.FC<Props> = ({ config }) => {
  const [concurrency, setConcurrency] = useState(5);
  const [iterations, setIterations] = useState(30);
  const [query, setQuery] = useState('SELECT 1;');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const handleRunBenchmark = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          concurrency,
          iterations,
          query,
        }),
      });
      const data: BenchmarkResult = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        totalRequests: iterations,
        successfulRequests: 0,
        failedRequests: iterations,
        totalTimeMs: 0,
        requestsPerSecond: 0,
        latencies: { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p99: 0 },
        errorSample: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Parameters */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-zinc-500" />
              Benchmark Latensi &amp; Throughput
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Uji stabilitas koneksi jaringan, jitter, dan throughput queries per second (QPS)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Konkurensi (Workers)</label>
            <select
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              <option value={1}>1 Worker (Sekuensial)</option>
              <option value={2}>2 Workers</option>
              <option value={5}>5 Workers (Rekomendasi)</option>
              <option value={10}>10 Workers</option>
              <option value={15}>15 Workers</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Total Permintaan (Iterations)</label>
            <select
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              <option value={10}>10 Requests</option>
              <option value={30}>30 Requests (Standar)</option>
              <option value={50}>50 Requests</option>
              <option value={100}>100 Requests</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Query Target</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT 1;"
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunBenchmark}
          disabled={isLoading || !config.host}
          className="w-full py-2.5 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 shadow-xs"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menjalankan Benchmark ({iterations} queries)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Mulai Stress &amp; Latency Benchmark</span>
            </>
          )}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-3">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] text-zinc-500 mb-1 flex items-center justify-between">
                <span>Throughput</span>
                <Zap className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="text-lg font-bold font-mono text-zinc-900">
                {result.requestsPerSecond} <span className="text-xs font-normal text-zinc-400">QPS</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Queries per detik</p>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] text-zinc-500 mb-1 flex items-center justify-between">
                <span>Rata-rata</span>
                <Activity className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="text-lg font-bold font-mono text-zinc-900">
                {result.latencies.avg} <span className="text-xs font-normal text-zinc-400">ms</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Average round trip</p>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] text-zinc-500 mb-1 flex items-center justify-between">
                <span>Berhasil</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700">
                {result.successfulRequests} / {result.totalRequests}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Kueri selesai</p>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] text-zinc-500 mb-1 flex items-center justify-between">
                <span>Gagal</span>
                <XCircle className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div
                className={`text-lg font-bold font-mono ${
                  result.failedRequests > 0 ? 'text-rose-600' : 'text-zinc-400'
                }`}
              >
                {result.failedRequests}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Kueri drop</p>
            </div>
          </div>

          {/* Percentiles */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-zinc-900">Distribusi Persentil Latensi</h4>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Min</span>
                <span className="text-sm font-semibold font-mono text-zinc-800">{result.latencies.min} ms</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">P50 (Median)</span>
                <span className="text-sm font-semibold font-mono text-zinc-800">{result.latencies.p50} ms</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Avg</span>
                <span className="text-sm font-semibold font-mono text-zinc-800">{result.latencies.avg} ms</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">P90</span>
                <span className="text-sm font-semibold font-mono text-zinc-800">{result.latencies.p90} ms</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">P99</span>
                <span className="text-sm font-semibold font-mono text-zinc-800">{result.latencies.p99} ms</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Max</span>
                <span className="text-sm font-semibold font-mono text-zinc-800">{result.latencies.max} ms</span>
              </div>
            </div>

            {result.errorSample && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-800 font-mono">
                Sample Error: {result.errorSample}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
