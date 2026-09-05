import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  Trash2,
  Cloud,
  Key,
  Server,
  Database,
  Moon,
  Sun,
  Code2,
  Quote
} from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';

interface SettingsViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onExportData: () => void;
  onDeleteAllData: () => void;
  onRequestConfirm: (title: string, msg: string, onConfirm: () => void) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  entries,
  darkMode,
  setDarkMode,
  onExportData,
  onDeleteAllData,
  onRequestConfirm
}) => {
  const [showArchitectureCode, setShowArchitectureCode] = useState(false);

  const handleDeleteAll = () => {
    onRequestConfirm(
      'Wipe All Personal Data?',
      'This will permanently delete all your journal entries, AI conversations, and insights from Cloud Firestore and local caches. This action cannot be reversed.',
      onDeleteAllData
    );
  };

  return (
    <div className="max-w-2xl sm:max-w-3xl mx-auto py-6 sm:py-10 space-y-10 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#E8E4DC] dark:border-[#2B2724]">
        <h1 className="font-editorial text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
          Settings
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Privacy, data sovereignty, and Google Cloud security architecture.
        </p>
      </div>

      {/* Authenticated Identity */}
      <section className="space-y-3">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
          Identity & Tenant Isolation
        </span>
        <div className="p-4 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full ring-1 ring-[#E8E4DC] dark:ring-[#2B2724]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#EFECE6] dark:bg-[#201E1C] text-stone-700 dark:text-stone-300 font-semibold text-sm flex items-center justify-center">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {user.displayName || 'EchoraOS User'}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400 font-mono">
                {user.isDemo ? 'Showcase guest account' : user.email}
              </div>
              <div className="text-[10px] text-stone-600 dark:text-stone-400 font-mono mt-0.5">
                UID: {user.uid}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Isolated Firestore Tenant</span>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-3">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
          Appearance
        </span>
        <div className="p-4 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Interface Theme
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Warm neutral paper canvas in light mode; eye-safe charcoal twilight in dark mode.
            </p>
          </div>
          <button
            id="settings-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1.5 rounded-lg border border-[#E8E4DC] dark:border-[#2B2724] text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-[#F0EDE6] dark:hover:bg-[#1E1C1A] transition-colors flex items-center gap-2"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-stone-600" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Google Cloud Enterprise Architecture */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
            Google Cloud Architecture
          </span>
          <button
            id="toggle-arch-code-btn"
            onClick={() => setShowArchitectureCode(!showArchitectureCode)}
            className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 font-mono"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showArchitectureCode ? 'Hide Rules' : 'Inspect Rules'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-900 dark:text-stone-100">
              <Database className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>User Scoped Firestore</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Every document path is bound to <code className="text-[10px] font-mono bg-stone-200/60 dark:bg-stone-800 px-1 py-0.5 rounded">users/&#123;uid&#125;</code>. Zero cross-user leakage.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-900 dark:text-stone-100">
              <Key className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Secret Manager</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Gemini API keys are protected in Google Cloud Secret Manager. No keys exposed in client bundles.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-900 dark:text-stone-100">
              <Server className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Cloud Run Container</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Server binds to port 3000 host 0.0.0.0 with native readiness probe at <code className="text-[10px] font-mono bg-stone-200/60 dark:bg-stone-800 px-1 py-0.5 rounded">/api/health</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-900 dark:text-stone-100">
              <Quote className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Grounded, Cited Reflection</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Gemini is instructed to reason only from the entries you provide it -- never to invent people, events, or memories. Every observation carries a citation you can open back to its source entry.
            </p>
          </div>
        </div>

        {showArchitectureCode && (
          <div className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto border border-stone-800 space-y-1">
            <div className="text-stone-600 dark:text-stone-400">// firestore.rules (Active & Deployed)</div>
            <pre className="text-[11px] leading-relaxed">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}</pre>
          </div>
        )}
      </section>

      {/* Data Sovereignty & Actions */}
      <section className="space-y-3">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
          Data Ownership & Actions
        </span>

        <div className="space-y-3 divide-y divide-[#F0EDE6] dark:divide-[#201E1C]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 first:pt-0">
            <div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                Export Journal Archive
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Download your complete journal history and reflections as an open JSON archive.
              </p>
            </div>
            <button
              id="export-journal-json-btn"
              onClick={onExportData}
              className="px-3.5 py-1.5 rounded-lg border border-[#E8E4DC] dark:border-[#2B2724] text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-[#F0EDE6] dark:hover:bg-[#1E1C1A] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Archive ({(entries || []).length} entries)</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
            <div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                Delete All Data
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Permanently erase all journal entries, conversation logs, and cached insights.
              </p>
            </div>
            <button
              id="wipe-all-user-data-btn"
              onClick={handleDeleteAll}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Erase All Data</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
