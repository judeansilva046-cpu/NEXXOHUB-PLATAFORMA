import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '../../../lib/errors';

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

    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;

    if (userError || !profile) {
      throw new AuthenticationError();
    }

    if (profile.role !== 'admin') {
      throw new AuthorizationError('Apenas administradores podem listar usuários');
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', profile.organization_id);

    if (usersError) {
      throw new Error('Failed to fetch users');
    }

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}