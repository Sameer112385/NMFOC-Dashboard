import { createClient } from '@supabase/supabase-js';
import { getSupabaseRuntimeConfig } from '@/lib/supabase/runtime-config';

export async function createSupabaseAdminClient() {
  const config = await getSupabaseRuntimeConfig();
  
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || config?.supabaseUrl || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || config?.supabaseServiceRoleKey || '').trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not configured. Please check environment variables or connection settings.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
