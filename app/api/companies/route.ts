import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorResponse } from '../../../lib/errors';
import { requireAuth, requireAdmin } from '../../../lib/api/auth-helpers';
import { createCompanySchema } from '../../../lib/validations/company';
import { serialize } from '../../../lib/serialize';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);

    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (companiesError) {
      throw new Error('Failed to fetch companies');
    }

    return NextResponse.json({
      success: true,
      data: serialize(companies),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdmin(profile, 'Apenas administradores podem criar empresas');

    const body = await req.json();
    const validatedData = createCompanySchema.parse(body);

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([
        {
          organization_id: profile.organization_id,
          ...validatedData,
        },
      ])
      .select()
      .single();

    if (companyError) {
      throw new Error('Failed to create company');
    }

    return NextResponse.json(
      {
        success: true,
        data: serialize(company),
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
