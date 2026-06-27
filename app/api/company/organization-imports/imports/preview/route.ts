import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { assertQuickImportType, createImportPreview } from '@/lib/quick-onboarding/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, membership } = await requirePortalContext('company');
    const formData = await request.formData();
    const type = assertQuickImportType(formData.get('type'));
    if (type === 'companies') throw new AuthorizationError('Empresas não importam empresas.');
    if (!membership.company_id) throw new AuthorizationError('Empresa não identificada.');
    formData.set('companyId', membership.company_id);
    const data = await createImportPreview({ supabase, user, membership, formData });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
