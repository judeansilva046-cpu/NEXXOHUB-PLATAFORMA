import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { createOrganizationSchema } from '../../../../lib/validations/organization';

type UserProfile = {
  organization_id?: string;
  role?: string;
};

type CompanyData = {
  organization_id?: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', params.id)
      .single();

    if (companyError || !company) {
      throw new NotFoundError('Empresa');
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;
    const companyData = company as unknown as CompanyData;

    if (!profile || profile.organization_id !== companyData.organization_id) {
      throw new AuthorizationError();
    }

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;

    if (!profile || profile.role !== 'admin') {
      throw new AuthorizationError();
    }

    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', params.id)
      .single();

    const companyData = company as unknown as CompanyData;

    if (!companyData || companyData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Empresa');
    }

    const body = await req.json();
    const validatedData = createOrganizationSchema.partial().parse(body);

    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update company');
    }

    return NextResponse.json({
      success: true,
      data: updatedCompany,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;

    if (!profile || profile.role !== 'admin') {
      throw new AuthorizationError();
    }

    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', params.id)
      .single();

    const companyData = company as unknown as CompanyData;

    if (!companyData || companyData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Empresa');
    }

    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', params.id);

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