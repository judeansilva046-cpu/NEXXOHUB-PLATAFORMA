import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, getErrorResponse } from '../../../../lib/errors';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    console.log('[API_AUTH_ME] Getting authenticated user...');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[API_AUTH_ME] No authenticated user found', { authError });
      throw new AuthenticationError();
    }

    console.log('[API_AUTH_ME] User found in auth.users:', { userId: user.id, email: user.email });

    // Get user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in public.users, create a default entry
    if (profileError && profileError.code === 'PGRST116') {
      console.log('[API_AUTH_ME] User not found in public.users, creating default profile...');

      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          role: 'member',
          organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null,
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('[API_AUTH_ME] Error creating user profile:', insertError);
        throw new Error('Falha ao criar perfil de usuário');
      }

      console.log('[API_AUTH_ME] User profile created successfully');

      return NextResponse.json({
        success: true,
        data: {
          ...((newProfile as unknown) as Record<string, unknown>),
          email: user.email,
        },
      });
    }

    if (profileError) {
      console.error('[API_AUTH_ME] Error fetching user profile:', profileError);
      throw new Error('Falha ao buscar perfil de usuário');
    }

    console.log('[API_AUTH_ME] User profile found:', { userId: user.id });

    return NextResponse.json({
      success: true,
      data: {
        ...((userProfile as unknown) as Record<string, unknown>),
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[API_AUTH_ME] Error:', error);
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}