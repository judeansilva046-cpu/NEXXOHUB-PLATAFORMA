import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { createOrganizationSchema } from '../../../../lib/validations/organization';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Get company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', params.id)
      .single();

    if (companyError || !company) {
      throw new NotFoundError('Empresa');
    }

    // Verify user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.organization_id !== company.organization_id) {
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
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Verify user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      throw new AuthorizationError();
    }

    // Get company to verify ownership
    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', params.id)
      .single();

    if (!company || company.organization_id !== userProfile.organization_id) {
      throw new NotFoundError('Empresa');
    }

    const body = await req.json();
    const validatedData = createOrganizationSchema.partial().parse(body);

    // Update company
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Verify user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      throw new AuthorizationError();
    }

    // Get company to verify ownership
    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', params.id)
      .single();

    if (!company || company.organization_id !== userProfile.organization_id) {
      throw new NotFoundError('Empresa');
    }

    // Delete company
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
