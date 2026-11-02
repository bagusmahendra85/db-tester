'use client';

import React, { useState } from 'react';
import { ConnectionConfig } from '@/lib/types';
import { Database, Shield, Zap, Eye, EyeOff, Server, HardDrive } from 'lucide-react';

interface Props {
  config: ConnectionConfig;
  onChange: (config: ConnectionConfig) => void;
  onTest: () => void;
  isLoading: boolean;
}

export const ConnectionForm: React.FC<Props> = ({ config, onChange, onTest, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTypeChange = (type: 'mysql' | 'postgres') => {
    onChange({
      ...config,
      type,
      port: type === 'mysql' ? 3306 : 5432,
      database: config.database || (type === 'postgres' ? 'postgres' : ''),
    });
  };

  const setPreset = (host: string, port: number, user: string, db: string) => {
    onChange({
      ...config,
      host,
      port,
      user,
      database: db,
    });
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-xs space-y-6">
      {/* Header & Database Engine Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-zinc-600" />
            Parameter Koneksi
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tentukan konfigurasi remote database server yang akan diuji
          </p>
        </div>

        {/* Minimalist Switcher */}
        <div className="inline-flex rounded-lg bg-zinc-100 p-1 border border-zinc-200/60">
          <button
            type="button"
            onClick={() => handleTypeChange('mysql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              config.type === 'mysql'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-600" />
            MariaDB / MySQL
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('postgres')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              config.type === 'postgres'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-sky-600" />
            PostgreSQL
          </button>
        </div>
      </div>

      {/* Host & Port */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Host / IP Address</label>
          <input
            type="text"
            value={config.host}
            onChange={(e) => onChange({ ...config, host: e.target.value })}
            placeholder="e.g. 192.168.1.100, db.domain.com, localhost"
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Port</label>
          <input
            type="number"
            value={config.port}
            onChange={(e) => onChange({ ...config, port: parseInt(e.target.value, 10) || 0 })}
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors font-mono"
          />
        </div>
      </div>

      {/* User, Password & Database */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Username</label>
          <input
            type="text"
            value={config.user}
            onChange={(e) => onChange({ ...config, user: e.target.value })}
            placeholder={config.type === 'mysql' ? 'root' : 'postgres'}
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={config.password || ''}
              onChange={(e) => onChange({ ...config, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors pr-9 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">
            Database <span className="text-zinc-400 font-normal">(Opsional)</span>
          </label>
          <input
            type="text"
            value={config.database || ''}
            onChange={(e) => onChange({ ...config, database: e.target.value })}
            placeholder={config.type === 'mysql' ? 'Default / Semua' : 'postgres'}
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
          />
        </div>
      </div>

      {/* SSL & Options */}
      <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 select-none">
            <input
              type="checkbox"
              checked={!!config.ssl}
              onChange={(e) => onChange({ ...config, ssl: e.target.checked })}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-4 w-4"
            />
            <Shield className="w-3.5 h-3.5 text-zinc-500" />
            Aktifkan SSL / TLS
          </label>

          {config.ssl && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 select-none">
              <input
                type="checkbox"
                checked={config.rejectUnauthorized === false}
                onChange={(e) => onChange({ ...config, rejectUnauthorized: !e.target.checked })}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-4 w-4"
              />
              Izinkan Self-Signed Certificate
            </label>
          )}

          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>Timeout:</span>
            <select
              value={config.timeoutMs || 5000}
              onChange={(e) => onChange({ ...config, timeoutMs: parseInt(e.target.value, 10) })}
              className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value={3000}>3 detik</option>
              <option value={5000}>5 detik (Default)</option>
              <option value={10000}>10 detik (Cloud)</option>
              <option value={15000}>15 detik (High Latency)</option>
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Preset:</span>
          <button
            type="button"
            onClick={() =>
              setPreset(
                '127.0.0.1',
                config.type === 'mysql' ? 3306 : 5432,
                config.type === 'mysql' ? 'root' : 'postgres',
                config.type === 'mysql' ? '' : 'postgres'
              )
            }
            className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 transition-colors"
          >
            Localhost
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div>
        <button
          type="button"
          onClick={onTest}
          disabled={isLoading || !config.host || !config.user}
          className="w-full py-2.5 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menghubungi Server &amp; Menganalisis...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Uji Koneksi &amp; Jalankan Diagnostik</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
