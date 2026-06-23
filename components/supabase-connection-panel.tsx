"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { Badge, surfaceCard } from '@/components/ui';

type SupabaseStatus = {
  configured: boolean;
  supabaseUrl: string;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  savedAt: string | null;
};

export function SupabaseConnectionPanel() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState('');
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/settings/supabase');
      const data = (await response.json()) as SupabaseStatus;
      setStatus(data);
      setSupabaseUrl(data.supabaseUrl ?? '');
    })();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/settings/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl,
          supabaseAnonKey,
          supabaseServiceRoleKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to save Supabase settings.');
      }

      if (supabaseUrl) {
        localStorage.setItem('sap-cn41-supabase-url', supabaseUrl);
      }
      if (supabaseAnonKey) {
        localStorage.setItem('sap-cn41-supabase-anon-key', supabaseAnonKey);
      }

      setStatus({
        configured: true,
        supabaseUrl,
        hasAnonKey: true,
        hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
        savedAt: data.savedAt ?? new Date().toISOString(),
      });
      setMessage(data.warning ? `Saved. Connection warning: ${data.warning}` : 'Supabase connection saved and tested.');
      setSupabaseAnonKey('');
      setSupabaseServiceRoleKey('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save Supabase settings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/settings/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to clear Supabase settings.');
      }
      localStorage.removeItem('sap-cn41-supabase-url');
      localStorage.removeItem('sap-cn41-supabase-anon-key');
      setSupabaseUrl('');
      setSupabaseAnonKey('');
      setSupabaseServiceRoleKey('');
      setStatus({
        configured: false,
        supabaseUrl: '',
        hasAnonKey: false,
        hasServiceRoleKey: false,
        savedAt: null,
      });
      setMessage('Saved Supabase connection cleared.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to clear Supabase settings.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`p-5 ${surfaceCard}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-text">Supabase Connection</h3>
          <p className="mt-1 text-sm text-muted">
            Save your Supabase URL and keys here to connect the app without relying only on env files.
          </p>
        </div>
        <Badge tone={status?.configured ? 'success' : 'warning'}>
          {status?.configured ? 'Connected' : 'Not connected'}
        </Badge>
      </div>

      <form onSubmit={handleSave} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm text-muted">Supabase URL</span>
          <input
            value={supabaseUrl}
            onChange={(event) => setSupabaseUrl(event.target.value)}
            placeholder="https://xxxxx.supabase.co"
            className="w-full rounded-2xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent/50"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted">Anon Key</span>
          <input
            value={supabaseAnonKey}
            onChange={(event) => setSupabaseAnonKey(event.target.value)}
            placeholder={status?.hasAnonKey ? 'Already saved - leave blank to keep' : 'Paste anon key'}
            className="w-full rounded-2xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent/50"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted">Service Role Key</span>
          <input
            value={supabaseServiceRoleKey}
            onChange={(event) => setSupabaseServiceRoleKey(event.target.value)}
            placeholder={status?.hasServiceRoleKey ? 'Already saved - leave blank to keep' : 'Optional for admin workflows'}
            className="w-full rounded-2xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent/50"
          />
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save & Test Connection'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="rounded-2xl border border-line/70 px-4 py-3 text-sm font-medium text-text transition hover:bg-panel2/80 disabled:opacity-60"
          >
            Clear saved connection
          </button>
          {message ? <span className="text-sm text-muted">{message}</span> : null}
        </div>
      </form>

      <div className={`mt-4 p-4 text-sm text-muted ${surfaceCard}`}>
        <div className="grid gap-2 md:grid-cols-3">
          <div>Configured: {status?.configured ? 'Yes' : 'No'}</div>
          <div>Anon key: {status?.hasAnonKey ? 'Saved' : 'Missing'}</div>
          <div>Service role: {status?.hasServiceRoleKey ? 'Saved' : 'Missing'}</div>
        </div>
        {status?.savedAt ? <div className="mt-2">Last saved: {new Date(status.savedAt).toLocaleString()}</div> : null}
      </div>
    </div>
  );
}
