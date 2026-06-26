import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const [{ data: profile, error: profileError }, { data: memberships }] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, full_name, role, organization_id, created_at, updated_at')
        .eq('id', user.id)
        .single(),
      supabase
        .from('portal_memberships')
        .select('id, portal, role, organization_id, clinic_id, company_id, employee_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ]);

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Perfil incompleto. Solicite a liberação de acesso ao administrador.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...profile,
          memberships: memberships || [],
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('[AUTH_ME_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar perfil' },
      { status: 500 }
    );
  }
}
