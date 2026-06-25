import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '../../../lib/errors';
import { createClinicSchema } from '../../../lib/validations/clinic';

type UserProfile = {
  organization_id?: string;
  role?: string;
};

export async function GET(_req: NextRequest) {
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
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;

    if (!profile?.organization_id) {
      throw new AuthenticationError();
    }

    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .eq('organization_id', profile.organization_id)
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

    if (!profile?.organization_id) {
      throw new AuthenticationError();
    }

    if (profile.role !== 'admin') {
      throw new AuthorizationError('Apenas administradores podem criar clínicas');
    }

    const body = await req.json();
    const validatedData = createClinicSchema.parse(body);

    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert([
        {
          organization_id: profile.organization_id,
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
