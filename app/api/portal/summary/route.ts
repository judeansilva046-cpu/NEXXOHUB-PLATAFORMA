import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import type { PortalType } from '../../../../lib/portal';

type Membership = {
  portal: PortalType;
  role: string;
  organization_id: string;
  clinic_id: string | null;
  company_id: string | null;
  employee_id: string | null;
};

function numberValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

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
    .select('portal, role, organization_id, clinic_id, company_id, employee_id')
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
      .select('id, name, employee_count, status')
      .eq('clinic_id', membership.clinic_id)
      .is('deleted_at', null)
      .order('employee_count', { ascending: false });

    const companies = companyRows || [];
    const activeCompanies = companies.filter((company) => company.status === 'active');
    const companyIds = companies.map((company) => company.id);

    const [
      employeesResult,
      programsResult,
      tracksResult,
      modulesResult,
      lessonsResult,
      reportsResult,
      plansResult,
      certificatesResult,
      helpRequestsResult,
      complaintsResult,
      pgrProgramsResult,
      dossiersResult,
      alertsResult,
      snapshotsResult,
      activitiesResult,
    ] = await Promise.all([
      companyIds.length
        ? supabase.from('employees').select('id, status').in('company_id', companyIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('programs')
        .select('id, title, status, company_id, created_at')
        .eq('clinic_id', membership.clinic_id)
        .order('created_at', { ascending: false }),
      supabase.from('tracks').select('id, status').eq('clinic_id', membership.clinic_id),
      supabase.from('modules').select('id, status').eq('clinic_id', membership.clinic_id),
      supabase.from('lessons').select('id, status').eq('clinic_id', membership.clinic_id),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
      companyIds.length
        ? supabase.from('action_plans').select('id, status').in('company_id', companyIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', membership.clinic_id),
      supabase.from('help_requests').select('id, status').eq('clinic_id', membership.clinic_id),
      supabase.from('complaints').select('id, status').eq('clinic_id', membership.clinic_id),
      supabase.from('pgr_programs').select('id, status').eq('clinic_id', membership.clinic_id),
      supabase.from('nr1_dossiers').select('id, status').eq('clinic_id', membership.clinic_id),
      companyIds.length
        ? supabase.from('smart_alerts').select('id, status, severity').in('company_id', companyIds)
        : Promise.resolve({ data: [] }),
      companyIds.length
        ? supabase
            .from('psychosocial_index_snapshots')
            .select('score, period_end, sample_size')
            .in('company_id', companyIds)
            .order('period_end', { ascending: true })
            .limit(12)
        : Promise.resolve({ data: [] }),
      supabase
        .from('activity_events')
        .select('id, title, description, event_type, occurred_at')
        .eq('organization_id', membership.organization_id)
        .order('occurred_at', { ascending: false })
        .limit(5),
    ]);

    const employees = employeesResult.data || [];
    const programs = programsResult.data || [];
    const tracks = tracksResult.data || [];
    const modules = modulesResult.data || [];
    const lessons = lessonsResult.data || [];
    const plans = plansResult.data || [];
    const helpRequests = helpRequestsResult.data || [];
    const complaints = complaintsResult.data || [];
    const pgrPrograms = pgrProgramsResult.data || [];
    const dossiers = dossiersResult.data || [];
    const alerts = alertsResult.data || [];
    const snapshots = snapshotsResult.data || [];
    let completedDiagnostics = 0;
    const employeeIds = employees.map((employee) => employee.id);
    if (employeeIds.length) {
      const { count } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .in('employee_id', employeeIds)
        .eq('status', 'completed');
      completedDiagnostics = count || 0;
    }
    const latestScore = snapshots.length
      ? numberValue(snapshots[snapshots.length - 1].score)
      : null;
    const activePrograms = programs.filter((program) => program.status === 'active').length;
    const activePlans = plans.filter((plan) => plan.status === 'active').length;

    return NextResponse.json({
      success: true,
      data: {
        role: membership.role,
        metrics: [
          { label: 'Empresas Ativas', value: activeCompanies.length },
          { label: 'Colaboradores', value: employees.length },
          { label: 'Programas Ativos', value: activePrograms },
          {
            label: 'Módulos Publicados',
            value: modules.filter((item) => item.status === 'active').length,
          },
          { label: 'Certificados Emitidos', value: certificatesResult.count || 0 },
          { label: 'Planos em Execução', value: activePlans },
        ],
        technicalMetrics: [
          {
            label: 'Trilhas Publicadas',
            value: tracks.filter((item) => item.status === 'active').length,
          },
          {
            label: 'Aulas Publicadas',
            value: lessons.filter((item) => item.status === 'active').length,
          },
          { label: 'Diagnósticos Realizados', value: completedDiagnostics },
          {
            label: 'Pedidos de Ajuda Pendentes',
            value: helpRequests.filter((item) => item.status !== 'closed').length,
          },
          {
            label: 'Denúncias Recebidas',
            value: complaints.filter((item) => item.status !== 'closed').length,
          },
          {
            label: 'PGRs Publicados',
            value: pgrPrograms.filter((item) => item.status === 'published').length,
          },
          {
            label: 'Dossiês NR-1 Publicados',
            value: dossiers.filter((item) => item.status === 'generated').length,
          },
          {
            label: 'Alertas de Risco Abertos',
            value: alerts.filter((item) => item.status !== 'resolved').length,
          },
          {
            label: 'Conformidade NR-1',
            value: activeCompanies.length
              ? Math.round(
                  (dossiers.filter((item) => item.status === 'generated').length /
                    activeCompanies.length) *
                    100
                )
              : 0,
            suffix: '%',
          },
        ],
        dashboard: {
          reports: reportsResult.count || 0,
          riskScore: latestScore,
          completionRate: employees.length
            ? Math.min(100, Math.round(((certificatesResult.count || 0) / employees.length) * 100))
            : 0,
          companies: companies.slice(0, 5),
          programStatus: {
            active: activePrograms,
            draft: programs.filter((program) => program.status === 'draft').length,
            archived: programs.filter((program) => program.status === 'archived').length,
          },
          planStatus: {
            active: activePlans,
            completed: plans.filter((plan) => plan.status === 'completed').length,
            delayed: plans.filter((plan) => plan.status === 'delayed').length,
          },
          technicalStatus: {
            helpRequests: helpRequests.filter((item) => item.status !== 'closed').length,
            complaints: complaints.filter((item) => item.status !== 'closed').length,
            pgrPrograms: pgrPrograms.filter((item) => item.status === 'published').length,
            dossiers: dossiers.filter((item) => item.status === 'generated').length,
            alerts: alerts.filter((item) => item.status !== 'resolved').length,
          },
        },
        series: snapshots.map((snapshot) => ({
          label: new Date(`${snapshot.period_end}T12:00:00`).toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit',
          }),
          value: numberValue(snapshot.score),
        })),
        activities: activitiesResult.data || [],
      },
    });
  }

  if (portal === 'company' && membership.company_id) {
    const [
      employeesResult,
      branchesResult,
      departmentsResult,
      positionsResult,
      programsResult,
      modulesResult,
      certificatesResult,
      snapshotsResult,
      importsResult,
      activitiesResult,
    ] = await Promise.all([
      supabase
        .from('employees')
        .select('id, status, department, created_at')
        .eq('company_id', membership.company_id),
      supabase.from('branches').select('id, status').eq('company_id', membership.company_id),
      supabase.from('departments').select('id, status').eq('company_id', membership.company_id),
      supabase.from('positions').select('id, status').eq('company_id', membership.company_id),
      supabase
        .from('programs')
        .select('id, title, status, created_at')
        .eq('company_id', membership.company_id)
        .order('created_at', { ascending: false }),
      supabase.from('modules').select('id, status').eq('company_id', membership.company_id),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id),
      supabase
        .from('psychosocial_index_snapshots')
        .select('score, period_end, sample_size')
        .eq('company_id', membership.company_id)
        .order('period_end', { ascending: true })
        .limit(12),
      supabase
        .from('quick_onboarding_imports')
        .select(
          'id, original_filename, import_type, status, total_rows, valid_rows, invalid_rows, error_count, created_at'
        )
        .eq('company_id', membership.company_id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('activity_events')
        .select('id, title, description, event_type, occurred_at')
        .eq('organization_id', membership.organization_id)
        .order('occurred_at', { ascending: false })
        .limit(5),
    ]);

    const employees = employeesResult.data || [];
    const branches = branchesResult.data || [];
    const departments = departmentsResult.data || [];
    const positions = positionsResult.data || [];
    const programs = programsResult.data || [];
    const modules = modulesResult.data || [];
    const snapshots = snapshotsResult.data || [];
    const latestScore = snapshots.length
      ? numberValue(snapshots[snapshots.length - 1].score)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        role: membership.role,
        metrics: [
          {
            label: 'Colaboradores Ativos',
            value: employees.filter((item) => item.status === 'active').length,
          },
          { label: 'Filiais', value: branches.filter((item) => item.status === 'active').length },
          {
            label: 'Departamentos',
            value: departments.filter((item) => item.status === 'active').length,
          },
          { label: 'Cargos', value: positions.filter((item) => item.status === 'active').length },
          { label: 'Certificados Emitidos', value: certificatesResult.count || 0 },
          {
            label: 'Programas Ativos',
            value: programs.filter((item) => item.status === 'active').length,
          },
        ],
        dashboard: {
          riskScore: latestScore,
          employeeStatus: {
            active: employees.filter((item) => item.status === 'active').length,
            inactive: employees.filter((item) => item.status === 'inactive').length,
            archived: employees.filter((item) => item.status === 'archived').length,
          },
          programStatus: {
            active: programs.filter((item) => item.status === 'active').length,
            draft: programs.filter((item) => item.status === 'draft').length,
            archived: programs.filter((item) => item.status === 'archived').length,
          },
          modules: modules.length,
          departments: employees.reduce<Record<string, number>>((accumulator, employee) => {
            const department = employee.department || 'Sem departamento';
            accumulator[department] = (accumulator[department] || 0) + 1;
            return accumulator;
          }, {}),
        },
        series: snapshots.map((snapshot) => ({
          label: new Date(`${snapshot.period_end}T12:00:00`).toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit',
          }),
          value: numberValue(snapshot.score),
        })),
        imports: importsResult.data || [],
        activities: activitiesResult.data || [],
      },
    });
  }

  if (portal === 'employee' && membership.employee_id) {
    const [
      { count: pending },
      { count: completed },
      { count: helpRequests },
      { count: certificates },
    ] = await Promise.all([
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
      supabase
        .from('help_requests')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', membership.employee_id)
        .neq('status', 'closed'),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', membership.employee_id),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        role: membership.role,
        metrics: [
          { label: 'Avaliações pendentes', value: pending || 0 },
          { label: 'Avaliações concluídas', value: completed || 0 },
          { label: 'Pedidos de ajuda ativos', value: helpRequests || 0 },
          { label: 'Certificados', value: certificates || 0 },
        ],
      },
    });
  }

  return NextResponse.json({ success: false, error: 'Escopo incompleto' }, { status: 409 });
}
