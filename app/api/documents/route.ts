import { NextRequest, NextResponse } from 'next/server';
import { requireApiContext } from '../../../lib/api-context';
import { AuthorizationError, getErrorResponse } from '../../../lib/errors';
import { documentSchema } from '../../../lib/validations/document';

export async function GET() {
  try {
    const { supabase } = await requireApiContext();
    const { data, error } = await supabase
      .from('documents')
      .select('*, companies(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireApiContext(['admin', 'manager']);
    const input = documentSchema.parse(await request.json());

    if (input.companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('id', input.companyId)
        .eq('organization_id', profile.organization_id)
        .single();
      if (!company) throw new AuthorizationError();
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        tenant_id: profile.organization_id,
        company_id: input.companyId || null,
        document_type: input.documentType,
        title: input.title,
        status: 'registered',
        created_by: user.id,
      })
      .select('*, companies(name)')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
