import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getProjectWbsMaster } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = String(searchParams.get('projectId') ?? '').trim();
  const type = String(searchParams.get('type') ?? '').trim().toLowerCase();

  if (!projectId || !['manpower', 'material'].includes(type)) {
    return NextResponse.json({ error: 'Project and template type are required.' }, { status: 400 });
  }

  const costWbs = (await getProjectWbsMaster(projectId))
    .filter((row) => row.is_active !== false && row.include_in_cost)
    .sort((a, b) => a.wbs_code.localeCompare(b.wbs_code));
  if (!costWbs.length) {
    return NextResponse.json({ error: 'No cost-included WBS found for this project. Select Include in Cost in WBS Master first.' }, { status: 400 });
  }

  const workbook = XLSX.utils.book_new();

  const templateRows =
    type === 'manpower'
      ? [
          {
            revenue_wbs_code: costWbs[0]?.wbs_code ?? '',
            work_center: '4002',
            cost_center: 'FLDENGS',
            labor_category: 'Field Engineers Senior',
            hourly_rate: 78,
          },
        ]
      : [
          {
            revenue_wbs_code: costWbs[0]?.wbs_code ?? '',
            material_code: 'CVL_DUCT-PEC-4X38-300M',
            material_description: 'Duct 110mm PEC 4x38',
            unit_of_measure: 'ROL',
            planned_quantity: 1,
            unit_price: 4500,
          },
        ];

  const templateSheet = XLSX.utils.json_to_sheet(templateRows);
  const referenceSheet = XLSX.utils.json_to_sheet(
    costWbs.map((row) => ({
      revenue_wbs_code: row.wbs_code,
      wbs_description: row.wbs_description,
    })),
  );

  XLSX.utils.book_append_sheet(workbook, templateSheet, type === 'manpower' ? 'Manpower Template' : 'Material Template');
  XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Cost WBS Reference');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const fileName = `${type}-bulk-template.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
