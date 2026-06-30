import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasSupabaseRuntimeConfig } from '@/lib/supabase/runtime-config';
import { cookies } from 'next/headers';
import { getCurrentAppUser } from '@/lib/current-user';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const isConfigured = await hasSupabaseRuntimeConfig();
  const cookieStore = await cookies();
  const hasDemoSession = cookieStore.has('sap-cn41-demo-session');

  if (isConfigured && !hasDemoSession) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        redirect('/login');
      }
    } catch {
      // Keep the app usable in local scaffolding mode.
    }
  }

  const currentUser = await getCurrentAppUser();
  return (
    <AppShell userRole={currentUser?.role ?? null} userName={currentUser?.fullName ?? null}>
      {children}
    </AppShell>
  );
}

