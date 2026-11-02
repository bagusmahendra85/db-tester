'use client';

import React, { useState } from 'react';
import { ConnectionConfig, ConnectionTestResponse } from '@/lib/types';
import { ConnectionForm } from '@/components/ConnectionForm';
import { TestResultView } from '@/components/TestResultView';
import { QueryConsole } from '@/components/QueryConsole';
import { BenchmarkView } from '@/components/BenchmarkView';
import { SavedProfilesView } from '@/components/SavedProfilesView';
import {
  Database,
  Activity,
  Code2,
  Bookmark,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function Home() {
  const [config, setConfig] = useState<ConnectionConfig>({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: '',
    ssl: false,
    rejectUnauthorized: false,
    timeoutMs: 5000,
  });

  const [activeTab, setActiveTab] = useState<'result' | 'query' | 'benchmark' | 'profiles'>('result');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setActiveTab('result');

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data: ConnectionTestResponse = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Gagal menghubungi backend API tester.',
        error: {
          message: err instanceof Error ? err.message : String(err),
          troubleshootingTip: 'Pastikan aplikasi db-server-tester berjalan dan server Next.js aktif.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = (newConfig: ConnectionConfig) => {
    setConfig(newConfig);
    setTestResult(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      {/* Minimalist Top Navigation */}
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-zinc-900">
                  DB Server Tester
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  v1.0
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium border border-zinc-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              MariaDB / MySQL
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium border border-zinc-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              PostgreSQL
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Connection Form */}
        <ConnectionForm
          config={config}
          onChange={setConfig}
          onTest={handleTestConnection}
          isLoading={isLoading}
        />

        {/* Minimalist Tabs Navigation */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('result')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'result'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Diagnostik &amp; Hasil
              {testResult?.success && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('query')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'query'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              SQL Playground
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Stress Benchmark
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'profiles'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Profil Tersimpan
            </button>
          </div>

          {/* Tab Views */}
          <div>
            {activeTab === 'result' && <TestResultView result={testResult} />}
            {activeTab === 'query' && <QueryConsole config={config} />}
            {activeTab === 'benchmark' && <BenchmarkView config={config} />}
            {activeTab === 'profiles' && (
              <SavedProfilesView currentConfig={config} onSelectProfile={handleProfileSelect} />
            )}
          </div>
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-4 text-xs text-zinc-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DB Server Tester &mdash; Minimalist Remote Database Utility</span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Akses langsung tanpa third-party proxy
          </span>
        </div>
      </footer>
    </div>
  );
}
