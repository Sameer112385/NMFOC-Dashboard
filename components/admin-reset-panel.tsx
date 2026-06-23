"use client";

import { useState } from 'react';
import { surfaceCard, Badge } from '@/components/ui';

type AdminAction = 'backup' | 'app_data' | 'full_reset';

export function AdminResetPanel({ canReset }: { canReset: boolean }) {
  const [loading, setLoading] = useState<AdminAction | null>(null);
  const [message, setMessage] = useState('');

  async function downloadBackup() {
    setMessage('');
    if (!canReset) {
      setMessage('Admin access is required.');
      return;
    }

    try {
      setLoading('backup');
      const response = await fetch('/api/admin/backup', { method: 'GET' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(payload.error ?? 'Unable to create backup.');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') ?? '';
      const fileName = getDownloadFileName(contentDisposition) ?? 'nmfoc-backup.xlsx';
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      setMessage('Backup download started.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create backup.');
    } finally {
      setLoading(null);
    }
  }

  async function runReset(action: 'app_data' | 'full_reset') {
    setMessage('');
    if (!canReset) {
      setMessage('Admin access is required.');
      return;
    }

    const confirmText =
      action === 'app_data'
        ? 'This will delete all project data, uploads, revenue outputs, PM updates, risks, and charts. User accounts will stay. Continue?'
        : 'This will delete all app data and all user records. Continue?';

    if (!window.confirm(confirmText)) return;

    if (
      action === 'full_reset' &&
      !window.confirm('Final warning: this removes users too. Type confirmation is not available here, so only continue if you are sure.')
    ) {
      return;
    }

    try {
      setLoading(action);
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to reset data.');
      }
      setMessage(action === 'app_data' ? 'App data reset completed.' : 'Full reset completed.');
      window.location.href = '/projects';
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to reset data.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={`p-5 ${surfaceCard} xl:col-span-2`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-text">Danger Zone</h3>
          <p className="mt-1 text-sm text-muted">Use these actions only when you need to back up data, wipe project data, or start over completely.</p>
        </div>
        <Badge tone={canReset ? 'warning' : 'default'}>{canReset ? 'Admin Only' : 'No Access'}</Badge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <button
          type="button"
          onClick={downloadBackup}
          disabled={!canReset || loading !== null}
          className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-4 text-left transition hover:bg-accent/10 disabled:opacity-50"
        >
          <div className="text-sm font-semibold text-accent">Backup All Data (Excel)</div>
          <div className="mt-2 text-sm text-muted">
            Exports projects, uploads, users, calculations, and admin data into one workbook before you reset anything.
          </div>
          <div className="mt-3 text-xs font-medium text-accent">{loading === 'backup' ? 'Preparing backup...' : 'Download workbook'}</div>
        </button>

        <button
          type="button"
          onClick={() => runReset('app_data')}
          disabled={!canReset || loading !== null}
          className="rounded-2xl border border-warning/30 bg-warning/5 px-4 py-4 text-left transition hover:bg-warning/10 disabled:opacity-50"
        >
          <div className="text-sm font-semibold text-warning">Reset App Data</div>
          <div className="mt-2 text-sm text-muted">
            Deletes projects, uploads, revenue outputs, PM updates, risks, snapshots, and storage files. Keeps user accounts intact.
          </div>
          <div className="mt-3 text-xs font-medium text-warning">{loading === 'app_data' ? 'Resetting...' : 'Run reset'}</div>
        </button>

        <button
          type="button"
          onClick={() => runReset('full_reset')}
          disabled={!canReset || loading !== null}
          className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-4 text-left transition hover:bg-danger/10 disabled:opacity-50"
        >
          <div className="text-sm font-semibold text-danger">Full Reset</div>
          <div className="mt-2 text-sm text-muted">
            Deletes app data, user profiles, and Supabase auth users, then clears storage objects in the main bucket.
          </div>
          <div className="mt-3 text-xs font-medium text-danger">{loading === 'full_reset' ? 'Resetting...' : 'Run full reset'}</div>
        </button>
      </div>

      {message ? <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted">{message}</div> : null}
    </div>
  );
}

function getDownloadFileName(contentDisposition: string) {
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? null;
}
