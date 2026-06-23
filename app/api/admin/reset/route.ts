import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isLocalDbMode, resetLocalAppData, resetLocalEverything } from '@/lib/local-db';
import { requireAdminUser } from '@/lib/current-user';

type ResetAction = 'app_data' | 'full_reset';

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const payload = (await request.json().catch(() => ({} as Record<string, unknown>))) as {
      action?: ResetAction;
    };
    const action = payload.action ?? 'app_data';

    if (action !== 'app_data' && action !== 'full_reset') {
      return NextResponse.json({ error: 'Invalid reset action.' }, { status: 400 });
    }

    if (await isLocalDbMode()) {
      if (action === 'app_data') {
        await resetLocalAppData();
      } else {
        await resetLocalEverything();
      }
      return NextResponse.json({ ok: true, action, mode: 'local' });
    }

    const supabase = await createSupabaseAdminClient();

    const bucketCleanup = supabase.from('storage.objects').delete().eq('bucket_id', 'cn41-files');
    if (action === 'app_data') {
      await Promise.all([
        supabase.from('pm_daily_updates').delete(),
        supabase.from('simulation_snapshots').delete(),
        supabase.from('risk_alerts').delete(),
        supabase.from('comments').delete(),
        supabase.from('revenue_wbs').delete(),
        supabase.from('cn41_rows').delete(),
        supabase.from('cn41_uploads').delete(),
        supabase.from('gr55_rows').delete(),
        supabase.from('gr55_uploads').delete(),
        supabase.from('sales_order_rows').delete(),
        supabase.from('sales_order_uploads').delete(),
        supabase.from('project_material_master').delete(),
        supabase.from('project_manpower_rates').delete(),
        supabase.from('project_subcontracts').delete(),
        supabase.from('project_wbs_master').delete(),
      supabase.from('project_cost_element_control').delete(),
        supabase.from('projects').delete(),
        bucketCleanup,
      ]);
      return NextResponse.json({ ok: true, action, mode: 'supabase' });
    }

    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    await Promise.all([
      supabase.from('pm_daily_updates').delete(),
      supabase.from('simulation_snapshots').delete(),
      supabase.from('risk_alerts').delete(),
      supabase.from('comments').delete(),
      supabase.from('revenue_wbs').delete(),
      supabase.from('cn41_rows').delete(),
      supabase.from('cn41_uploads').delete(),
      supabase.from('gr55_rows').delete(),
      supabase.from('gr55_uploads').delete(),
      supabase.from('sales_order_rows').delete(),
      supabase.from('sales_order_uploads').delete(),
      supabase.from('project_material_master').delete(),
      supabase.from('project_manpower_rates').delete(),
      supabase.from('project_subcontracts').delete(),
      supabase.from('project_wbs_master').delete(),
      supabase.from('project_cost_element_control').delete(),
      supabase.from('projects').delete(),
      supabase.from('users_profile').delete(),
      bucketCleanup,
    ]);

    for (const user of authUsers.users ?? []) {
      await supabase.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json({ ok: true, action, mode: 'supabase' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset data.';
    const status = message.includes('Admin access is required') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
