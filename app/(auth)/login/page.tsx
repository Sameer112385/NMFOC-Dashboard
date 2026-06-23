"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [showDbPanel, setShowDbPanel] = useState(false);
  const [dbUrl, setDbUrl] = useState('');
  const [dbAnonKey, setDbAnonKey] = useState('');
  const [dbServiceKey, setDbServiceKey] = useState('');
  const [dbSaving, setDbSaving] = useState(false);
  const [dbMessage, setDbMessage] = useState('');

  useEffect(() => {
    // Clear demo session on mount (logout)
    window.localStorage.removeItem('sap-cn41-demo-session');
    document.cookie = 'sap-cn41-demo-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    (async () => {
      try {
        const response = await fetch('/api/settings/supabase');
        if (response.ok) {
          const data = await response.json();
          if (data.configured && data.supabaseUrl && data.supabaseAnonKey) {
            window.localStorage.setItem('sap-cn41-supabase-url', data.supabaseUrl);
            window.localStorage.setItem('sap-cn41-supabase-anon-key', data.supabaseAnonKey);
            setIsSupabaseConfigured(true);
            try {
              const supabase = createSupabaseBrowserClient();
              supabase.auth.signOut();
            } catch {
              // ignore
            }
            return;
          }
        }
      } catch (err) {
        console.error('Failed to sync Supabase client configuration', err);
      }

      const configured =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
        Boolean(
          window.localStorage.getItem('sap-cn41-supabase-url') &&
            window.localStorage.getItem('sap-cn41-supabase-anon-key'),
        );
      setIsSupabaseConfigured(configured);

      if (configured) {
        try {
          const supabase = createSupabaseBrowserClient();
          supabase.auth.signOut();
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const isAdminLogin =
      email.trim().toLowerCase() === 'admin' ||
      email.trim().toLowerCase() === 'admin@local' ||
      email.trim().toLowerCase() === 'admin@example.com';

    if (isAdminLogin && password === 'admin123') {
      localStorage.setItem(
        'sap-cn41-demo-session',
        JSON.stringify({
          email: 'admin@local',
          role: 'Admin',
          authenticatedAt: new Date().toISOString(),
        }),
      );
      // Set the demo session cookie for the server layout to read
      document.cookie = 'sap-cn41-demo-session=true; path=/; max-age=86400';
      router.push('/projects');
      return;
    }

    if (!isSupabaseConfigured) {
      if (isSignUp) {
        setMessage('Sign Up is not available in local demo mode. Use the admin/admin123 credentials.');
        setLoading(false);
        return;
      }
      setMessage('Demo login: use admin / admin123 until Supabase is configured.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        if (error) throw error;
        if (data?.user && !data.session) {
          setMessage('Registration successful! Please check your email to confirm.');
        } else {
          router.push('/projects');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/projects');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDbSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dbUrl || !dbAnonKey) {
      setDbMessage('URL and Anon Key are required.');
      return;
    }
    setDbSaving(true);
    setDbMessage('');
    try {
      const res = await fetch('/api/settings/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl: dbUrl, supabaseAnonKey: dbAnonKey, supabaseServiceRoleKey: dbServiceKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save.');
      localStorage.setItem('sap-cn41-supabase-url', dbUrl);
      localStorage.setItem('sap-cn41-supabase-anon-key', dbAnonKey);
      setIsSupabaseConfigured(true);
      setShowDbPanel(false);
      setDbMessage('');
    } catch (err) {
      setDbMessage(err instanceof Error ? err.message : 'Failed to save connection.');
    } finally {
      setDbSaving(false);
    }
  }

  async function handleMagicLink() {
    setLoading(true);
    setMessage('');
    try {
      if (!isSupabaseConfigured) {
        setMessage('Supabase is not configured yet. Use the temporary admin login: admin / admin123.');
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage('Check your email for a login link.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send login link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-10 shadow-glow flex flex-col items-center">
        {/* Detasad Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="text-4xl font-black tracking-widest bg-gradient-to-r from-accent via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            DETASAD
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
            Detecon Al Saudia
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-text">
            Project Dashboard
          </h1>
          <p className="mt-2 text-xs text-muted">
            {isSignUp ? "Create an account to get started." : "Sign in to access project baselines, updates, and simulations."}
          </p>
        </div>

        {/* Database connection status / panel */}
        <div className="mt-6 w-full">
          <button
            type="button"
            onClick={() => setShowDbPanel(v => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold transition hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-accent" />
              <span className="text-muted">Database</span>
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isSupabaseConfigured ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                {isSupabaseConfigured ? 'Connected' : 'Not connected'}
              </span>
            </span>
            {showDbPanel ? <ChevronUp className="h-3.5 w-3.5 text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-muted" />}
          </button>

          {showDbPanel && (
            <form onSubmit={handleDbSave} className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Supabase URL</span>
                <input
                  value={dbUrl}
                  onChange={e => setDbUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-xs text-text outline-none placeholder:text-muted/40 focus:border-accent/40"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Anon Key</span>
                <input
                  value={dbAnonKey}
                  onChange={e => setDbAnonKey(e.target.value)}
                  placeholder="eyJ..."
                  className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-xs text-text outline-none placeholder:text-muted/40 focus:border-accent/40"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Service Role Key <span className="normal-case text-muted/60">(optional)</span></span>
                <input
                  value={dbServiceKey}
                  onChange={e => setDbServiceKey(e.target.value)}
                  placeholder="eyJ..."
                  className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-xs text-text outline-none placeholder:text-muted/40 focus:border-accent/40"
                />
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={dbSaving}
                  className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-bg transition hover:opacity-90 disabled:opacity-60"
                >
                  {dbSaving ? 'Connecting...' : 'Connect'}
                </button>
                {dbMessage && <span className="text-xs text-warning">{dbMessage}</span>}
              </div>
            </form>
          )}
        </div>

        <form className="mt-8 w-full space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted">Email or Username</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="text"
              className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3.5 text-sm text-text outline-none transition duration-200 placeholder:text-muted/40 focus:border-accent/40 focus:bg-white/[0.05]"
              placeholder={isSupabaseConfigured ? "name@company.com" : "admin"}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3.5 text-sm text-text outline-none transition duration-200 placeholder:text-muted/40 focus:border-accent/40 focus:bg-white/[0.05]"
              placeholder="••••••••"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              disabled={loading}
              type="submit"
              className="flex-1 rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-bg transition duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (isSignUp ? "Registering..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
            {!isSignUp && (
              <button
                disabled={loading || !email}
                type="button"
                onClick={handleMagicLink}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-text transition duration-200 hover:bg-white/5 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                Magic Link
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage("");
            }}
            className="text-accent hover:underline font-semibold"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {message ? (
          <p className="mt-4 text-center text-xs text-muted bg-white/5 px-3 py-2 rounded-lg">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

