'use client';

import React from 'react';
import { ConnectionTestResponse } from '@/lib/types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  Database,
  AlertTriangle,
  Activity,
  Server,
  Zap,
} from 'lucide-react';

interface Props {
  result: ConnectionTestResponse | null;
}

export const TestResultView: React.FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-white border border-zinc-200/80 rounded-xl p-12 text-center text-zinc-400">
        <Server className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-zinc-300" />
        <h3 className="text-xs font-semibold text-zinc-700">Belum Ada Hasil Uji</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-0.5">
          Masukkan informasi remote server di atas, lalu tekan tombol &quot;Uji Koneksi&quot; untuk memulai.
        </p>
      </div>
    );
  }

  if (!result.success) {
    return (
      <div className="space-y-4">
        {/* Error Header */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-rose-900">Koneksi Gagal Terhubung</h3>
            <p className="text-xs text-rose-800 font-mono break-all">{result.message}</p>
            {result.error?.code && (
              <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                Code: {result.error.code}
              </span>
            )}
          </div>
        </div>

        {/* Troubleshooting Card */}
        {result.error?.troubleshootingTip && (
          <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Saran Perbaikan Teknis
            </div>
            <pre className="text-xs text-zinc-700 bg-zinc-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-sans leading-relaxed border border-zinc-200/60">
              {result.error.troubleshootingTip}
            </pre>
          </div>
        )}
      </div>
    );
  }

  const { server, timing } = result;
  const connPercent =
    server?.maxConnections && server?.currentConnections
      ? Math.min(100, Math.round((server.currentConnections / server.maxConnections) * 100))
      : null;

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-emerald-950">Koneksi Berhasil</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                Connected
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">{result.message}</p>
          </div>
        </div>

        {timing && (
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider">Total Latency</div>
            <div className="text-base font-bold font-mono text-emerald-900">{timing.totalMs} ms</div>
          </div>
        )}
      </div>

      {/* Latency Breakdown Cards */}
      {timing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
              <span>TCP Connect</span>
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-base font-semibold font-mono text-zinc-900">{timing.tcpConnectMs} ms</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Transport handshake</p>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
              <span>Auth Handshake</span>
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-base font-semibold font-mono text-zinc-900">{timing.authHandshakeMs} ms</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">SSL &amp; auth verify</p>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
              <span>Query Ping</span>
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-base font-semibold font-mono text-zinc-900">{timing.queryPingMs} ms</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">SELECT version()</p>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
              <span>Total RTT</span>
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-base font-semibold font-mono text-zinc-900">{timing.totalMs} ms</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Round trip response</p>
          </div>
        </div>
      )}

      {/* Server Specs & Connection Capacity */}
      {server && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Specs */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2.5">
              <Cpu className="w-4 h-4 text-zinc-500" />
              Spesifikasi Server
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-zinc-500">Engine:</span>
                <span className="font-medium text-zinc-800">{server.engine}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-zinc-500">Versi:</span>
                <span className="font-mono text-zinc-800 text-right max-w-[220px] truncate" title={server.version}>
                  {server.version}
                </span>
              </div>
              {server.uptime && (
                <div className="flex justify-between items-start">
                  <span className="text-zinc-500">Uptime:</span>
                  <span className="text-zinc-800">{server.uptime}</span>
                </div>
              )}
              {server.charset && (
                <div className="flex justify-between items-start">
                  <span className="text-zinc-500">Encoding / Charset:</span>
                  <span className="text-zinc-800 font-mono">{server.charset}</span>
                </div>
              )}
            </div>
          </div>

          {/* Connection Capacity */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2.5">
              <Activity className="w-4 h-4 text-zinc-500" />
              Beban &amp; Kapasitas Koneksi
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Koneksi Aktif Saat Ini:</span>
                <span className="font-mono font-semibold text-zinc-900">
                  {server.currentConnections !== undefined ? server.currentConnections : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Batas Maksimum (max_connections):</span>
                <span className="font-mono text-zinc-700">
                  {server.maxConnections !== undefined ? server.maxConnections : 'N/A'}
                </span>
              </div>

              {connPercent !== null && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Penggunaan Slot</span>
                    <span className="font-mono font-medium text-zinc-700">{connPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        connPercent > 80 ? 'bg-rose-500' : connPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(2, connPercent)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Databases List */}
      {server?.databases && server.databases.length > 0 && (
        <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              Daftar Database ({server.databases.length})
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
            {server.databases.map((db) => (
              <span
                key={db}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-50 text-zinc-700 border border-zinc-200/60"
              >
                {db}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
