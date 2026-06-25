import { createClient } from '../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 *
 * Resposta esperada:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "user-uuid",
 *     "email": "user@example.com",
 *     "full_name": "Nome do Usuário",
 *     "role": "member|admin",
 *     "organization_id": "org-uuid"
 *   }
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();

    console.log('[API_AUTH_ME] Step 1: Getting authenticated user from auth.users...');

    // STEP 1: Get authenticated user from auth.users
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[API_AUTH_ME] Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!authUser) {
      console.error('[API_AUTH_ME] No authenticated user found');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[API_AUTH_ME] Step 2: User authenticated', {
      userId: authUser.id,
      email: authUser.email,
    });

    // STEP 2: Try to fetch user profile from public.users
    console.log('[API_AUTH_ME] Step 3: Fetching user profile from public.users...');

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, organization_id, created_at, updated_at')
      .eq('id', authUser.id)
      .single();

    // STEP 3: If profile not found, create it
    if (profileError) {
      console.warn('[API_AUTH_ME] Profile fetch error:', {
        code: profileError.code,
        message: profileError.message,
      });

      if (profileError.code === 'PGRST116' || profileError.message?.includes('not found')) {
        console.log('[API_AUTH_ME] Step 4: User profile not found, attempting to create...');

        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
            role: 'member',
            organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id, email, full_name, role, organization_id, created_at, updated_at')
          .single();

        if (insertError) {
          console.error('[API_AUTH_ME] Failed to create user profile:', insertError);
          // Fallback: return basic auth user data
          console.log('[API_AUTH_ME] Fallback: Returning basic auth user data');
          return NextResponse.json({
            success: true,
            data: {
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
              role: 'member',
              organization_id: null,
            },
          });
        }

        console.log('[API_AUTH_ME] User profile created successfully');
        return NextResponse.json({
          success: true,
          data: newProfile,
        });
      } else {
        // RLS or other error: fallback to auth user data
        console.warn('[API_AUTH_ME] Profile error (possible RLS), using auth user data as fallback');
        return NextResponse.json({
          success: true,
          data: {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
            role: 'member',
            organization_id: null,
          },
        });
      }
    }

    // STEP 4: Profile found, return it
    console.log('[API_AUTH_ME] User profile found successfully');
    return NextResponse.json({
      success: true,
      data: userProfile,
    });
  } catch (err: unknown) {
    console.error('[API_AUTH_ME] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';

    // Fallback: try to return basic data
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}