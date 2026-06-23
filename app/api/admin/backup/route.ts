import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isLocalDbMode, readLocalBackupSnapshot } from '@/lib/local-db';
import { requireAdminUser } from '@/lib/current-user';

type SheetSource = {
  sheetName: string;
  tableName: string;
  rows: Array<Record<string, unknown>>;
};

const EXPORT_SHEETS: Array<{ sheetName: string; tableName: string }> = [
  { sheetName: 'Projects', tableName: 'projects' },
  { sheetName: 'CN41 Uploads', tableName: 'cn41_uploads' },
  { sheetName: 'CN41 Rows', tableName: 'cn41_rows' },
  { sheetName: 'GR55 Uploads', tableName: 'gr55_uploads' },
  { sheetName: 'GR55 Rows', tableName: 'gr55_rows' },
  { sheetName: 'Sales Orders', tableName: 'sales_order_rows' },
  { sheetName: 'Sales Order Uploads', tableName: 'sales_order_uploads' },
  { sheetName: 'Revenue WBS', tableName: 'revenue_wbs' },
  { sheetName: 'WBS Master', tableName: 'project_wbs_master' },
  { sheetName: 'Cost Element Control', tableName: 'project_cost_element_control' },
  { sheetName: 'Subcontracts', tableName: 'project_subcontracts' },
  { sheetName: 'Manpower Rates', tableName: 'project_manpower_rates' },
  { sheetName: 'Material Master', tableName: 'project_material_master' },
  { sheetName: 'PM Updates', tableName: 'pm_daily_updates' },
  { sheetName: 'Snapshots', tableName: 'simulation_snapshots' },
  { sheetName: 'Risk Alerts', tableName: 'risk_alerts' },
  { sheetName: 'Comments', tableName: 'comments' },
  { sheetName: 'Users Profile', tableName: 'users_profile' },
];

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdminUser();

    const workbook = XLSX.utils.book_new();
    const issues: string[] = [];
    const generatedAt = new Date().toISOString();
    const isLocalMode = await isLocalDbMode();

    const sources = isLocalMode
      ? buildLocalSources(await readLocalBackupSnapshot())
      : await buildSupabaseSources(issues);

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { key: 'generated_at', value: generatedAt },
        { key: 'mode', value: isLocalMode ? 'local' : 'supabase' },
        { key: 'sheet_count', value: sources.length },
        { key: 'notes', value: 'One workbook containing the app data tables for restore or audit purposes.' },
      ]),
      'Summary',
    );

    for (const source of sources) {
      const safeRows = source.rows.map((row) => sanitizeForExcel(row));
      const sheet = safeRows.length ? XLSX.utils.json_to_sheet(safeRows) : XLSX.utils.aoa_to_sheet([['No rows']]);
      XLSX.utils.book_append_sheet(workbook, sheet, source.sheetName);
    }

    if (issues.length) {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(issues.map((issue, index) => ({ row: index + 1, issue }))),
        'Backup Issues',
      );
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const stamp = generatedAt.replace(/[:]/g, '-').replace(/\..+$/, '').replace('T', '_');
    const fileName = `nmfoc-backup-${stamp}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create backup.';
    const status = message.includes('Admin access is required') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function buildLocalSources(snapshot: Record<string, Array<Record<string, unknown>>>): SheetSource[] {
  return EXPORT_SHEETS.map(({ sheetName, tableName }) => ({
    sheetName,
    tableName,
    rows: (snapshot[tableName] ?? []) as Array<Record<string, unknown>>,
  }));
}

async function buildSupabaseSources(issues: string[]): Promise<SheetSource[]> {
  const supabase = await createSupabaseAdminClient();
  const sources: SheetSource[] = [];

  for (const entry of EXPORT_SHEETS) {
    if (entry.tableName === 'users_profile') {
      const { data, error } = await supabase.from('users_profile').select('*');
      if (error) {
        issues.push(`users_profile: ${error.message}`);
        sources.push({ ...entry, rows: [] });
      } else {
        sources.push({ ...entry, rows: (data ?? []) as Array<Record<string, unknown>> });
      }
      continue;
    }

    const { data, error } = await supabase.from(entry.tableName).select('*');
    if (error) {
      issues.push(`${entry.tableName}: ${error.message}`);
      sources.push({ ...entry, rows: [] });
      continue;
    }

    sources.push({ ...entry, rows: (data ?? []) as Array<Record<string, unknown>> });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    issues.push(`auth.users: ${authError.message}`);
  } else {
    sources.push({
      sheetName: 'Auth Users',
      tableName: 'auth_users',
      rows: (authData.users ?? []).map((user) => ({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role ?? null,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
      })),
    });
  }

  return sources;
}

function sanitizeForExcel(row: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    output[key] = sanitizeValue(value);
  }
  return output;
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}
