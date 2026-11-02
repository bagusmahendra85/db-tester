'use client';

import React, { useState } from 'react';
import { ConnectionConfig, QueryExecuteResponse } from '@/lib/types';
import { Play, Download, Search, AlertCircle, Clock, Table as TableIcon } from 'lucide-react';

interface Props {
  config: ConnectionConfig;
}

export const QueryConsole: React.FC<Props> = ({ config }) => {
  const isMySQL = config.type === 'mysql';
  const defaultSql = isMySQL
    ? 'SELECT 1 AS ping, CURRENT_TIMESTAMP() AS now, VERSION() AS version;'
    : 'SELECT 1 AS ping, NOW() AS now, version();';

  const [sql, setSql] = useState(defaultSql);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryExecuteResponse | null>(null);
  const [filterText, setFilterText] = useState('');

  const quickTemplates = isMySQL
    ? [
        { label: 'Ping / Clock', sql: 'SELECT 1 AS ping, CURRENT_TIMESTAMP() AS now, VERSION() AS version;' },
        { label: 'Daftar Tabel', sql: 'SHOW FULL TABLES;' },
        { label: 'Proses Aktif', sql: 'SHOW FULL PROCESSLIST;' },
        { label: 'Status Mesin', sql: "SHOW STATUS WHERE Variable_name IN ('Uptime', 'Threads_connected', 'Questions', 'Slow_queries');" },
        { label: 'Ukuran DB', sql: "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables GROUP BY table_schema;" },
      ]
    : [
        { label: 'Ping / Clock', sql: 'SELECT 1 AS ping, NOW() AS now, version();' },
        { label: 'Daftar Tabel', sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" },
        { label: 'Aktivitas Query', sql: 'SELECT pid, usename, client_addr, state, query FROM pg_stat_activity WHERE state IS NOT NULL;' },
        { label: 'Ukuran DB', sql: 'SELECT datname, pg_size_pretty(pg_database_size(datname)) AS size FROM pg_database ORDER BY pg_database_size(datname) DESC;' },
      ];

  const handleRunQuery = async () => {
    if (!sql.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, sql, maxRows: 100 }),
      });
      const data: QueryExecuteResponse = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        executionTimeMs: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportJSON = () => {
    if (!result?.rows) return;
    const blob = new Blob([JSON.stringify(result.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!result?.rows || !result?.columns) return;
    const headers = result.columns.join(',');
    const rows = result.rows.map((row) =>
      result.columns
        ?.map((col) => {
          const val = row[col];
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRows =
    result?.rows?.filter((row) => {
      if (!filterText) return true;
      return Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(filterText.toLowerCase())
      );
    }) || [];

  return (
    <div className="space-y-4">
      {/* Editor Box */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
            <TableIcon className="w-4 h-4 text-zinc-500" />
            SQL Query Tester ({config.type === 'mysql' ? 'MySQL / MariaDB' : 'PostgreSQL'})
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 mr-1">Template:</span>
            {quickTemplates.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setSql(t.sql)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={4}
            placeholder="Tulis query SQL di sini..."
            className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs text-zinc-500">
            Target: <strong className="text-zinc-800 font-mono">{config.host}:{config.port}</strong>{' '}
            (DB: <strong className="text-zinc-800 font-mono">{config.database || 'default'}</strong>)
          </span>

          <button
            type="button"
            onClick={handleRunQuery}
            disabled={isLoading || !sql.trim() || !config.host}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 shadow-xs"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Mengeksekusi...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Jalankan Query</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 shadow-xs">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Waktu: <strong className="text-zinc-900 font-mono">{result.executionTimeMs} ms</strong>
              </span>

              {result.rowCount !== undefined && (
                <span className="text-zinc-500">
                  Baris: <strong className="text-zinc-900 font-mono">{result.rowCount}</strong>
                </span>
              )}
            </div>

            {result.success && result.rows && result.rows.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter hasil..."
                    className="bg-white border border-zinc-200 rounded-md pl-7 pr-3 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportJSON}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  >
                    <Download className="w-3 h-3" /> JSON
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {!result.success && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-rose-900">Error Saat Eksekusi SQL</h4>
                <p className="text-xs font-mono text-rose-800 mt-1 break-all">{result.error}</p>
              </div>
            </div>
          )}

          {/* Table */}
          {result.success && result.columns && result.columns.length > 0 && (
            <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-xs">
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 sticky top-0 text-zinc-500 border-b border-zinc-200/80">
                    <tr>
                      <th className="py-2 px-3 font-mono text-zinc-400 w-10 text-center">#</th>
                      {result.columns.map((col) => (
                        <th key={col} className="py-2 px-3 font-semibold font-mono text-zinc-700">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-mono text-zinc-800">
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-2 px-3 text-zinc-400 text-center">{idx + 1}</td>
                          {result.columns?.map((col) => {
                            const val = row[col];
                            const displayVal =
                              val === null
                                ? 'NULL'
                                : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val);
                            return (
                              <td
                                key={col}
                                className={`py-2 px-3 whitespace-nowrap max-w-xs truncate ${
                                  val === null ? 'text-zinc-400 italic' : ''
                                }`}
                                title={displayVal}
                              >
                                {displayVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={(result.columns?.length || 0) + 1}
                          className="py-6 text-center text-zinc-400 italic"
                        >
                          {result.rows && result.rows.length === 0
                            ? 'Query selesai (0 baris ditemukan).'
                            : 'Tidak ada baris yang sesuai dengan filter.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
