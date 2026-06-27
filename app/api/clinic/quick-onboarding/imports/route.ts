import { NextRequest, NextResponse } from 'next/server';
import { getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { quickImportTypes } from '@/lib/quick-onboarding/config';

export async function GET(request: NextRequest) {
  try {
    const { supabase, membership } = await requirePortalContext('clinic');
    const params = request.nextUrl.searchParams;
    const page = Math.max(Number(params.get('page') || '1'), 1);
    const pageSize = Math.min(Math.max(Number(params.get('pageSize') || '20'), 1), 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('quick_onboarding_imports')
      .select(
        'id, import_type, status, original_filename, total_rows, valid_rows, invalid_rows, created_count, updated_count, error_count, created_at, completed_at, companies(name)',
        { count: 'exact' }
      )
      .eq('clinic_id', membership.clinic_id)
      .order('created_at', { ascending: false });

    const type = params.get('type');
    if (type && quickImportTypes.includes(type as (typeof quickImportTypes)[number])) {
      query = query.eq('import_type', type);
    }

    const status = params.get('status');
    if (status) query = query.eq('status', status);

    const companyId = params.get('companyId');
    if (companyId) query = query.eq('company_id', companyId);

    const search = params.get('q');
    if (search) query = query.ilike('original_filename', `%${search}%`);

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: { page, pageSize, total: count || 0 },
    });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
