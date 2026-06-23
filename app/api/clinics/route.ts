import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, ValidationError, getErrorResponse } from '../../../lib/errors';
import { createOrganizationSchema } from '../../../lib/validations/organization';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      throw new AuthenticationError();
    }

    // Get all clinics for organization
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .order('created_at', { ascending: false });

    if (clinicsError) {
      throw new Error('Failed to fetch clinics');
    }

    return NextResponse.json({
      success: true,
      data: clinics,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Get user's organization and check if admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      throw new AuthenticationError();
    }

    if (userProfile.role !== 'admin') {
      throw new AuthorizationError('Apenas administradores podem criar clínicas');
    }

    const body = await req.json();
    const validatedData = createOrganizationSchema.parse(body);

    // Create clinic
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert([
        {
          organization_id: userProfile.organization_id,
          ...validatedData,
        },
      ])
      .select()
      .single();

    if (clinicError) {
      throw new Error('Failed to create clinic');
    }

    return NextResponse.json(
      {
        success: true,
        data: clinic,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
