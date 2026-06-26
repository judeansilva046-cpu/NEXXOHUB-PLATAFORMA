import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import type { PortalType } from '../../../../lib/portal';

type Membership = {
  portal: PortalType;
  role: string;
  clinic_id: string | null;
  company_id: string | null;
  employee_id: string | null;
};

export async function GET(request: NextRequest) {
  const portal = request.nextUrl.searchParams.get('portal') as PortalType | null;
  if (!portal || !['clinic', 'company', 'employee'].includes(portal)) {
    return NextResponse.json({ success: false, error: 'Portal inválido' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  const { data: membershipData } = await supabase
    .from('portal_memberships')
    .select('portal, role, clinic_id, company_id, employee_id')
    .eq('user_id', user.id)
    .eq('portal', portal)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const membership = membershipData as Membership | null;
  if (!membership) {
    return NextResponse.json({ success: false, error: 'Acesso não autorizado' }, { status: 403 });
  }

  if (portal === 'clinic' && membership.clinic_id) {
    const { data: companyRows } = await supabase
      .from('companies')
      .select('id')
      .eq('clinic_id', membership.clinic_id)
      .eq('status', 'active');
    const companies = companyRows || [];
    const companyIds = companies.map((company) => company.id);
    const [{ count: employees }, { count: reports }, { count: plans }] = await Promise.all([
      companyIds.length
        ? supabase
            .from('employees')
            .select('id', { count: 'exact', head: true })
            .in('company_id', companyIds)
        : Promise.resolve({ count: 0 }),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
      supabase
        .from('action_plans')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        role: membership.role,
        metrics: [
          { label: 'Empresas clientes', value: companies.length },
          { label: 'Colaboradores monitorados', value: employees || 0 },
          { label: 'Relatórios gerados', value: reports || 0 },
          { label: 'Planos de ação ativos', value: plans || 0 },
        ],
      },
    });
  }

  if (portal === 'company' && membership.company_id) {
    const [
      { count: employees },
      { count: branches },
      { count: departments },
      { count: positions },
    ] = await Promise.all([
      supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id),
      supabase
        .from('branches')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id),
      supabase
        .from('departments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id),
      supabase
        .from('positions')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        role: membership.role,
        metrics: [
          { label: 'Colaboradores cadastrados', value: employees || 0 },
          { label: 'Filiais', value: branches || 0 },
          { label: 'Departamentos', value: departments || 0 },
          { label: 'Cargos', value: positions || 0 },
        ],
      },
    });
  }

  if (portal === 'employee' && membership.employee_id) {
    const [{ count: pending }, { count: completed }, { count: helpRequests }] = await Promise.all([
      supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', membership.employee_id)
        .in('status', ['scheduled', 'in_progress']),
      supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', membership.employee_id)
        .eq('status', 'completed'),
      Promise.resolve({ count: 0 }),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        role: membership.role,
        metrics: [
          { label: 'Avaliações pendentes', value: pending || 0 },
          { label: 'Avaliações concluídas', value: completed || 0 },
          { label: 'Pedidos de ajuda ativos', value: helpRequests || 0 },
          { label: 'Certificados', value: 0 },
        ],
      },
    });
  }

  return NextResponse.json({ success: false, error: 'Escopo incompleto' }, { status: 409 });
}
