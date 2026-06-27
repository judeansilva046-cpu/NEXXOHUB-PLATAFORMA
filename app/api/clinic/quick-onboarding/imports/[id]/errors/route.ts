import { NextResponse } from 'next/server';
import { getErrorResponse, NotFoundError } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';

type Context = { params: { id: string } };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { supabase, membership } = await requirePortalContext('clinic');
    const { data: importRecord } = await supabase
      .from('quick_onboarding_imports')
      .select('id')
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .maybeSingle();
    if (!importRecord) throw new NotFoundError('Importação');

    const { data, error } = await supabase
      .from('quick_onboarding_import_errors')
      .select('row_number, field, code, message, severity, row_data, created_at')
      .eq('import_id', params.id)
      .order('row_number')
      .limit(500);
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
