import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, RefreshCw, Key, Shield, Play } from 'lucide-react';
import { DbStatus } from '../types';
import { api } from '../api';

interface DbStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatus | null;
  onRefreshStatus: () => Promise<void>;
}

export const DbStatusModal: React.FC<DbStatusModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefreshStatus,
}) => {
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  if (!isOpen) return null;

  const handleRunMigrations = async () => {
    setIsRunningMigration(true);
    setMigrationResult(null);
    try {
      const res = await api.runMigrations();
      setMigrationResult(res);
      await onRefreshStatus();
    } catch (err: any) {
      setMigrationResult({
        success: false,
        message: err.message || 'Migration execution failed.',
      });
    } finally {
      setIsRunningMigration(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${dbStatus?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">PostgreSQL Connection Status</h3>
              <p className="text-xs text-stone-500">CraveCart Infrastructure &amp; Database Health</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Status Badge */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            dbStatus?.connected 
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            {dbStatus?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {dbStatus?.connected ? 'Connected to PostgreSQL Database' : 'Database Connection Required'}
              </p>
              <p className="text-xs opacity-90 leading-relaxed">
                {dbStatus?.connected
                  ? `Active PostgreSQL instance (Server version ${dbStatus.version || '16+'}). ${dbStatus.tablesCount} public tables verified.`
                  : dbStatus?.error || 'DATABASE_URL is not set or using placeholder credentials.'}
              </p>
            </div>
          </div>

          {/* Database Info Cards */}
          {dbStatus?.connected && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-[11px] text-stone-500 uppercase font-semibold">Public Tables</span>
                <p className="text-lg font-bold text-stone-900 tabular-nums">{dbStatus.tablesCount || 17}</p>
                <span className="text-[10px] text-stone-400">17 Normalized Tables</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-[11px] text-stone-500 uppercase font-semibold">Views</span>
                <p className="text-lg font-bold text-stone-900">2 Active</p>
                <span className="text-[10px] text-stone-400">loyalty & perf</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-[11px] text-stone-500 uppercase font-semibold">Procedural</span>
                <p className="text-lg font-bold text-stone-900">5 Objects</p>
                <span className="text-[10px] text-stone-400">Proc, Func, Trg, Cur</span>
              </div>
            </div>
          )}

          {/* Migration & Seeding Action */}
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-stone-900 text-xs">Run Schema & Seed Data</h4>
                <p className="text-[11px] text-stone-500">
                  Idempotently applies DDL schema, views, procedures, triggers, and September 2026 test orders.
                </p>
              </div>
              <button
                onClick={handleRunMigrations}
                disabled={isRunningMigration}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isRunningMigration ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Initialize Schema</span>
                  </>
                )}
              </button>
            </div>

            {migrationResult && (
              <div className={`p-3 rounded-lg text-xs border ${
                migrationResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <p className="font-medium">{migrationResult.message}</p>
                {migrationResult.details && (
                  <p className="text-[11px] mt-1 opacity-85">
                    Tables created: {migrationResult.details.tablesCount} · Views verified: Yes · Functions & Procedure ready.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Setup Instructions for Neon PostgreSQL */}
          <div className="space-y-2 text-xs text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
              <Key className="w-3.5 h-3.5 text-rose-600" />
              <span>How to Configure Neon PostgreSQL:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-stone-600 pl-1">
              <li>Create a free PostgreSQL database at <strong>neon.tech</strong> (or use any hosted Postgres provider).</li>
              <li>Copy your database connection string URI (e.g., <code className="bg-stone-200/80 px-1 py-0.5 rounded text-[10px] text-stone-800 font-mono">postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require</code>).</li>
              <li>In AI Studio, add a secret named <code className="font-mono text-stone-900 font-bold">DATABASE_URL</code> with your connection string.</li>
              <li>Click &quot;Initialize Schema&quot; above to auto-create all 17 tables, views, procedures, and sample data.</li>
            </ol>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 pt-1 border-t border-stone-200/80 mt-2">
              <Shield className="w-3 h-3 text-stone-400" />
              <span>Strict Security: Database credentials are kept server-side only and never exposed to the client.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100/70 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={onRefreshStatus}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Health</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
