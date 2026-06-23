import { NextResponse } from 'next/server';
import { getLatestSourceUploads } from '@/lib/data';
import { isLocalDbMode } from '@/lib/local-db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = String(searchParams.get('projectId') ?? '').trim();

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  try {
    const latest = await getLatestSourceUploads(projectId);
    return NextResponse.json({
      ok: true,
      projectId,
      localMode: await isLocalDbMode(),
      latest,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to read latest financial source uploads.' },
      { status: 500 },
    );
  }
}
