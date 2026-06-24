import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isLocalDbMode } from '@/lib/local-db';

export type CurrentAppUser = {
  id: string;
  email: string;
  role: string;
  mode: 'demo' | 'supabase';
};

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const cookieStore = await cookies();

  if (await isLocalDbMode()) {
    if (!cookieStore.has('sap-cn41-demo-session')) return null;
    return {
      id: 'demo-admin',
      email: 'admin@local',
      role: 'Admin',
      mode: 'demo',
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return null;

    let role = String(user.user_metadata?.role ?? 'Viewer');
    try {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      role = String(profile?.role ?? role ?? 'Viewer');
    } catch {
      // ignore profile lookup failures
    }

    return {
      id: user.id,
      email: user.email ?? '',
      role,
      mode: 'supabase',
    };
  } catch {
    return null;
  }
}

export async function requireAdminUser() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== 'Admin') {
    throw new Error('Admin access is required.');
  }
  return user;
}

export function canEditProjectMaster(role?: string | null): boolean {
  return role === 'Admin' || role === 'Cost Controller';
}

export function canAccessSettings(role?: string | null): boolean {
  return role === 'Admin' || role === 'Cost Controller';
}
