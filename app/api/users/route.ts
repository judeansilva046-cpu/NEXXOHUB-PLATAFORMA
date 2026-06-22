import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '@/lib/errors';

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
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userProfile) {
      throw new AuthenticationError();
    }

    // Only admins can list users
    if (userProfile.role !== 'admin') {
      throw new AuthorizationError('Apenas administradores podem listar usuários');
    }

    // Get all users in organization
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', userProfile.organization_id);

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
