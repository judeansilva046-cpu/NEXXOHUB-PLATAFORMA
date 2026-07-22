import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { serialize } from '../../../../lib/serialize';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTHENTICATION_ERROR', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, organization_id, created_at, updated_at')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            full_name:
              authUser.user_metadata?.full_name ||
              authUser.email?.split('@')[0] ||
              'Usuário',
            role: 'user',
            organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null,
          })
          .select('id, email, full_name, role, organization_id, created_at, updated_at')
          .single();

        if (insertError) {
          return NextResponse.json({
            success: true,
            data: serialize({
              id: authUser.id,
              email: authUser.email,
              full_name:
                authUser.user_metadata?.full_name ||
                authUser.email?.split('@')[0] ||
                'Usuário',
              role: 'user',
              organization_id: null,
            }),
          });
        }

        return NextResponse.json({ success: true, data: serialize(newProfile) });
      }

      return NextResponse.json({
        success: true,
        data: serialize({
          id: authUser.id,
          email: authUser.email,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.email?.split('@')[0] ||
            'Usuário',
          role: 'user',
          organization_id: null,
        }),
      });
    }

    return NextResponse.json({ success: true, data: serialize(userProfile) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}