import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, getErrorResponse } from '../../../lib/errors';

type UserOrg = {
  organization_id?: string;
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

    const { data: userOrg, error: userOrgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = userOrg as unknown as UserOrg;

    if (userOrgError || !profile?.organization_id) {
      throw new Error('User organization not found');
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single();

    if (orgError) {
      throw new Error('Organization not found');
    }

    return NextResponse.json({
      success: true,
      data: org,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json(
    {
      statusCode: 405,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Organizações são provisionadas durante o cadastro.',
    },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
