'use client';

import React, { useState, useEffect } from 'react';
import { ConnectionConfig, SavedProfile } from '@/lib/types';
import { Bookmark, Trash2, Download, Upload, Plus, Check } from 'lucide-react';

interface Props {
  currentConfig: ConnectionConfig;
  onSelectProfile: (config: ConnectionConfig) => void;
}

const STORAGE_KEY = 'db_tester_saved_profiles';

export const SavedProfilesView: React.FC<Props> = ({ currentConfig, onSelectProfile }) => {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [profileName, setProfileName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfiles(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveProfilesToStorage = (updated: SavedProfile[]) => {
    setProfiles(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleSaveCurrent = () => {
    if (!profileName.trim()) return;

    const newProfile: SavedProfile = {
      id: 'prof_' + Date.now(),
      name: profileName.trim(),
      config: { ...currentConfig },
      createdAt: Date.now(),
    };

    const updated = [newProfile, ...profiles];
    saveProfilesToStorage(updated);
    setProfileName('');
  };

  const handleDelete = (id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    saveProfilesToStorage(updated);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `db-tester-profiles-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const merged = [...parsed, ...profiles];
          saveProfilesToStorage(merged);
        }
      } catch {
        alert('Format file JSON profil tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleApply = (profile: SavedProfile) => {
    onSelectProfile(profile.config);
    setCopiedId(profile.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Save current config card */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-zinc-500" />
            Simpan Konfigurasi Saat Ini
          </h3>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-700 cursor-pointer transition-colors">
              <Upload className="w-3 h-3 text-zinc-500" />
              Import JSON
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            {profiles.length > 0 && (
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors"
              >
                <Download className="w-3 h-3 text-zinc-500" />
                Export JSON
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Nama profil, contoh: RDS MariaDB Staging / Cloud Postgres"
            className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
          />
          <button
            type="button"
            onClick={handleSaveCurrent}
            disabled={!profileName.trim()}
            className="px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Simpan Profil
          </button>
        </div>
      </div>

      {/* Profile List */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Daftar Profil ({profiles.length})
        </h4>

        {profiles.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-xl p-8 text-center text-zinc-400 text-xs">
            Belum ada profil yang tersimpan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-zinc-200/80 rounded-xl p-4 flex items-start justify-between gap-3 hover:border-zinc-300 transition-all shadow-xs"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-zinc-900 truncate">{p.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        p.config.type === 'mysql'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-sky-50 text-sky-700 border border-sky-200/60'
                      }`}
                    >
                      {p.config.type === 'mysql' ? 'MySQL' : 'Postgres'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate">
                    {p.config.user}@{p.config.host}:{p.config.port}
                  </div>
                  {p.config.database && (
                    <div className="text-[11px] text-zinc-400 truncate">
                      DB: <span className="font-mono text-zinc-600">{p.config.database}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApply(p)}
                    className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors"
                    title="Gunakan profil ini"
                  >
                    {copiedId === p.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <span className="text-xs px-1 text-zinc-900 font-medium">Pakai</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                    title="Hapus profil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
