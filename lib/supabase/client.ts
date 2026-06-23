import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  const savedUrl =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('sap-cn41-supabase-url')?.trim() || undefined
      : undefined;
  const savedAnonKey =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('sap-cn41-supabase-anon-key')?.trim() || undefined
      : undefined;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || savedUrl || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || savedAnonKey || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Open Settings and save the connection details first.');
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
  );
}
