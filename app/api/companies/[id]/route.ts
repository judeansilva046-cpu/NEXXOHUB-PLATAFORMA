import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { requireAuth, requireAdmin } from '../../../../lib/api/auth-helpers';
import { updateCompanySchema } from '../../../../lib/validations/company';
import { serialize } from '../../../../lib/serialize';

type CompanyData = {
  organization_id?: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (companyError || !company) {
      throw new NotFoundError('Empresa');
    }

    const companyData = company as CompanyData;
    if (profile.organization_id !== companyData.organization_id) {
      throw new AuthorizationError();
    }

    return NextResponse.json({
      success: true,
      data: serialize(company),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdmin(profile);

    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', id)
      .single();

    const companyData = company as CompanyData;
    if (!companyData || companyData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Empresa');
    }

    const body = await req.json();
    const validatedData = updateCompanySchema.parse(body);

    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update company');
    }

    return NextResponse.json({
      success: true,
      data: serialize(updatedCompany),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdmin(profile);

    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', id)
      .single();

    const companyData = company as CompanyData;
    if (!companyData || companyData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Empresa');
    }

    const { error: deleteError } = await supabase.from('companies').delete().eq('id', id);

    if (deleteError) {
      throw new Error('Failed to delete company');
    }

    return NextResponse.json({
      success: true,
      message: 'Empresa deletada com sucesso',
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
