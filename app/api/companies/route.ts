import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '../../../lib/errors';
import { createCompanySchema } from '../../../lib/validations/company';

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
      data: companies,
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
      throw new AuthorizationError('Apenas administradores podem criar empresas');
    }

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
        data: company,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
