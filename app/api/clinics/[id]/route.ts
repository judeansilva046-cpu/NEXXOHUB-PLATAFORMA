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

    // Get clinic
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', params.id)
      .single();

    if (clinicError || !clinic) {
      throw new NotFoundError('Clínica');
    }

    // Verify user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.organization_id !== clinic.organization_id) {
      throw new AuthorizationError();
    }

    return NextResponse.json({
      success: true,
      data: clinic,
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

    // Get clinic to verify ownership
    const { data: clinic } = await supabase
      .from('clinics')
      .select('organization_id')
      .eq('id', params.id)
      .single();

    if (!clinic || clinic.organization_id !== userProfile.organization_id) {
      throw new NotFoundError('Clínica');
    }

    const body = await req.json();
    const validatedData = createOrganizationSchema.partial().parse(body);

    // Update clinic
    const { data: updatedClinic, error: updateError } = await supabase
      .from('clinics')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update clinic');
    }

    return NextResponse.json({
      success: true,
      data: updatedClinic,
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

    // Get clinic to verify ownership
    const { data: clinic } = await supabase
      .from('clinics')
      .select('organization_id')
      .eq('id', params.id)
      .single();

    if (!clinic || clinic.organization_id !== userProfile.organization_id) {
      throw new NotFoundError('Clínica');
    }

    // Delete clinic
    const { error: deleteError } = await supabase
      .from('clinics')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      throw new Error('Failed to delete clinic');
    }

    return NextResponse.json({
      success: true,
      message: 'Clínica deletada com sucesso',
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
