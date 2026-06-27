import { NextRequest, NextResponse } from 'next/server';
import { getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { createImportPreview } from '@/lib/quick-onboarding/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, membership } = await requirePortalContext('clinic');
    const formData = await request.formData();
    const data = await createImportPreview({ supabase, user, membership, formData });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
