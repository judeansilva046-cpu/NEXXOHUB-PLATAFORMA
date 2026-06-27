import { NextResponse } from 'next/server';
import { getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { confirmImport } from '@/lib/quick-onboarding/service';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function POST(_request: Request, { params }: Context) {
  try {
    const { supabase, user, membership } = await requirePortalContext('company');
    const data = await confirmImport({ supabase, user, membership, importId: params.id });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
