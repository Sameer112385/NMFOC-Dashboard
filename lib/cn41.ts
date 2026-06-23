import * as XLSX from 'xlsx';
import { safeNumber } from '@/lib/utils';
import type { CN41Row } from '@/lib/types';

const CLEAN_KEYS: Record<string, string> = {
  'prrevpl000': 'prrevpl000',
  'pr_rev_pl000': 'prrevpl000',
  'pr_rev_pl_000': 'prrevpl000',
  'revenue_plan': 'prrevpl000',
  'revenue_plan_value': 'prrevpl000',
  'act_rev': 'actual_revenue',
  'act_revenue': 'actual_revenue',
  'actual_revenue': 'actual_revenue',
  'actual_rev': 'actual_revenue',
  'actrev': 'actual_revenue',
  'ocostplan0': 'planned_cost',
  'prcstsc000': 'planned_cost',
  'projektelm': 'wbs_code',
  'projectelm': 'wbs_code',
  'projectitem': 'wbs_code',
  'project_item': 'wbs_code',
  'project_object': 'wbs_description',
  'act._costs': 'actual_cost',
  'act_costs': 'actual_cost',
  'work_(a)': 'actual_work',
  'work_(r)': 'remaining_work',
  'ocostplan': 'planned_cost',
  'work_a': 'actual_work',
  'work_r': 'remaining_work',
  'actual_cost': 'actual_cost',
  'actual_cost_value': 'actual_cost',
  'planned_cost': 'planned_cost',
  'plan_cost': 'planned_cost',
  'balance_cost': 'balance_cost',
  'remaining_balance': 'balance_cost',
  'actual_work': 'actual_work',
  'remaining_work': 'remaining_work',
  'wbs_description': 'wbs_description',
  'description': 'wbs_description',
  'wbs_code': 'wbs_code',
  'wbs_element': 'wbs_code',
  'level': 'level',
  'lvl': 'level',
  'hierarchy_level': 'level',
  'object_type': 'object_type',
  'objecttype': 'object_type',
  'object': 'object_type',
  'network': 'network',
  'activity': 'activity',
  'status': 'status',
};

export type ParsedCN41 = {
  projectCode: string;
  projectName: string;
  rows: CN41Row[];
  level03Rows: CN41Row[];
};

export async function parseCn41File(file: File): Promise<ParsedCN41> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  const rows = rawRows.map((row) => normalizeRow(row));
  const projectCode = inferProjectCode(rows);
  const projectName = inferProjectName(rows, projectCode);
  const level03Rows = rows.filter((row) => isRevenueGeneratingRow(row));

  return {
    projectCode,
    projectName,
    rows,
    level03Rows,
  };
}

function normalizeRow(row: Record<string, unknown>): CN41Row {
  const normalized: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(row)) {
    const baseKey = normalizeHeaderKey(key);
    const cleanKey = CLEAN_KEYS[baseKey] ?? CLEAN_KEYS[key] ?? baseKey;
    normalized[cleanKey] = value as string | number | boolean | null;
  }

  const level = safeNumber(normalized.level ?? normalized['lev'] ?? normalized['row_level'] ?? normalized['hierarchy_level']);
  return {
    level,
    object_type: String(normalized.object_type ?? normalized.obj_type ?? normalized['type'] ?? '').trim(),
    wbs_code: String(
      normalized.wbs_code ??
        normalized.projectitem ??
        normalized.project_item ??
        normalized.wbs ??
        normalized.wbs_element ??
        normalized['wbs element'] ??
        '',
    ).trim(),
    wbs_description: String(normalized.wbs_description ?? normalized.description ?? normalized['description'] ?? normalized.project_object ?? '').trim(),
    network: String(normalized.network ?? '').trim(),
    activity: String(normalized.activity ?? normalized.act ?? '').trim(),
    status: String(normalized.status ?? normalized.system_status ?? '').trim(),
    actual_cost: safeNumber(normalized.actual_cost ?? normalized.act_cost ?? normalized['actual cost'] ?? normalized['act. costs']),
    planned_cost: safeNumber(normalized.planned_cost ?? normalized.plan_cost ?? normalized['planned cost'] ?? normalized['plan value'] ?? normalized.ocostplan0 ?? normalized.prcstsc000),
    balance_cost: safeNumber(normalized.balance_cost ?? normalized.bal_cost ?? normalized['balance']),
    actual_work: safeNumber(normalized.actual_work ?? normalized.act_work ?? normalized['work (a)']),
    remaining_work: safeNumber(normalized.remaining_work ?? normalized.rem_work ?? normalized['work (r)']),
    actual_revenue: normalized.actual_revenue !== '' ? safeNumber(normalized.actual_revenue) : null,
    prrevpl000: normalized.prrevpl000 !== '' ? safeNumber(normalized.prrevpl000) : null,
    raw_data_json: normalized,
  };
}

function inferProjectCode(rows: CN41Row[]) {
  const candidate = rows.find((row) => row.level === 1 || row.level === 2) ?? rows[0];
  return candidate?.wbs_code?.split(/[./-]/)[0] || candidate?.wbs_description?.split(/\s+/)[0] || 'PROJECT-001';
}

function inferProjectName(rows: CN41Row[], projectCode: string) {
  const candidate = rows.find((row) => row.level === 1 || row.level === 2 || row.wbs_code?.includes(projectCode));
  return candidate?.wbs_description || `Project ${projectCode}`;
}

function isRevenueGeneratingRow(row: CN41Row) {
  const raw = row.raw_data_json ?? {};
  const levelValue = String(raw.level ?? raw.lev ?? row.level ?? '').trim();
  const objectTypeValue = String(raw.objecttype ?? raw.ObjectType ?? raw.object_type ?? row.object_type ?? '').trim().toLowerCase();
  return (levelValue === '03' || levelValue === '3' || Number(levelValue) === 3) && isWbsElementObjectType(objectTypeValue);
}

export function isWbsElementObjectType(objectType: string) {
  const value = String(objectType ?? '').trim().toLowerCase();
  return /^wbs[\s_-]*element(s)?$/.test(value);
}

function normalizeHeaderKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '')
    .replace(/__+/g, '_');
}
