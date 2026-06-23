import { NextResponse } from 'next/server';
import { createProjectManpowerRate, deleteProjectManpowerRate } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const project_id = String(payload.project_id ?? '').trim();
    const revenue_wbs_code = String(payload.revenue_wbs_code ?? '').trim();
    const labor_category = String(payload.labor_category ?? '').trim();
    const work_center = String(payload.work_center ?? '').trim();
    const cost_center = String(payload.cost_center ?? '').trim();
    const hourly_rate = Number(payload.hourly_rate ?? 0);

    if (!project_id || !labor_category || hourly_rate <= 0) {
      return NextResponse.json({ error: 'Project, labor category, and hourly rate are required.' }, { status: 400 });
    }

    const row = await createProjectManpowerRate({
      project_id,
      revenue_wbs_code: revenue_wbs_code || '',
      labor_category,
      work_center: work_center || null,
      cost_center: cost_center || null,
      hourly_rate,
      is_active: true,
    });

    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save manpower rate master.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await request.json();
    const id = String(payload.id ?? '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Rate id is required.' }, { status: 400 });
    }
    await deleteProjectManpowerRate(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete manpower rate master.' },
      { status: 500 },
    );
  }
}
