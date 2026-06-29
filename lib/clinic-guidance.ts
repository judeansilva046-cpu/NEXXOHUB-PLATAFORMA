import type { createClient } from './supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type StepStatus = 'completed' | 'in_progress' | 'pending' | 'overdue';
export type StatusTone = 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'slate';

export type ImplementationStep = {
  key: string;
  label: string;
  description: string;
  href: string;
  owner: 'Clínica' | 'Empresa' | 'Ambos';
  status: StepStatus;
};

export type CompanyImplementation = {
  companyId: string;
  companyName: string;
  progress: number;
  completed: number;
  total: number;
  statusLabel: string;
  statusTone: StatusTone;
  nextStep: ImplementationStep | null;
  steps: ImplementationStep[];
};

export type ClinicActivity = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  occurred_at: string;
};

export type ClinicWorkspaceSnapshot = {
  metrics: {
    activeCompanies: number;
    collaborators: number;
    averageImplementation: number;
    pendingImplementations: number;
    technicalPendencies: number;
    activePrograms: number;
    generatedDossiers: number;
    publishedPgrs: number;
    activeLessons: number;
    certificatesIssued: number;
    openCareRequests: number;
    openComplaints: number;
    openTechnicalCases: number;
  };
  implementations: CompanyImplementation[];
  activities: ClinicActivity[];
};

type CompanyRow = {
  id: string;
  name: string;
  employee_count: number | null;
  status: string | null;
  created_at: string;
};
type CompanyScopedRow = { id: string; company_id: string | null; status?: string | null };
type EmployeeRow = { id: string; company_id: string; status?: string | null };
type AssessmentRow = { id: string; employee_id: string; status?: string | null };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isOlderThan(dateValue: string, days: number) {
  const createdAt = new Date(dateValue).getTime();
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt > days * MS_PER_DAY;
}

function countByCompany<T extends { company_id: string | null }>(
  rows: T[],
  companyId: string,
  predicate: (row: T) => boolean = () => true
) {
  return rows.filter((row) => row.company_id === companyId && predicate(row)).length;
}

function countGlobalOrCompany<T extends { company_id: string | null }>(
  rows: T[],
  companyId: string,
  predicate: (row: T) => boolean = () => true
) {
  return rows.filter(
    (row) => (row.company_id === companyId || row.company_id === null) && predicate(row)
  ).length;
}

function buildStatus({
  done,
  started = false,
  overdue = false,
}: {
  done: boolean;
  started?: boolean;
  overdue?: boolean;
}): StepStatus {
  if (done) return 'completed';
  if (started) return 'in_progress';
  if (overdue) return 'overdue';
  return 'pending';
}

function statusSummary(
  steps: ImplementationStep[]
): Pick<CompanyImplementation, 'statusLabel' | 'statusTone'> {
  if (steps.every((step) => step.status === 'completed')) {
    return { statusLabel: 'Pronta para operar', statusTone: 'green' };
  }
  if (steps.some((step) => step.status === 'overdue')) {
    return { statusLabel: 'Ação atrasada', statusTone: 'red' };
  }
  if (steps.some((step) => step.status === 'in_progress')) {
    return { statusLabel: 'Em implantação', statusTone: 'blue' };
  }
  return { statusLabel: 'Implantação pendente', statusTone: 'orange' };
}

function buildCompanyImplementation({
  company,
  branches,
  departments,
  positions,
  employees,
  assessments,
  employeeCompany,
  pgrs,
  actionPlans,
  programs,
  lessons,
  certificates,
  dossiers,
}: {
  company: CompanyRow;
  branches: CompanyScopedRow[];
  departments: CompanyScopedRow[];
  positions: CompanyScopedRow[];
  employees: EmployeeRow[];
  assessments: AssessmentRow[];
  employeeCompany: Map<string, string>;
  pgrs: CompanyScopedRow[];
  actionPlans: CompanyScopedRow[];
  programs: CompanyScopedRow[];
  lessons: CompanyScopedRow[];
  certificates: CompanyScopedRow[];
  dossiers: CompanyScopedRow[];
}): CompanyImplementation {
  const companyId = company.id;
  const oldCompany = isOlderThan(company.created_at, 14);
  const companyEmployees = employees.filter((row) => row.company_id === companyId);
  const employeeIds = new Set(companyEmployees.map((row) => row.id));
  const diagnosticsCount = assessments.filter(
    (row) => employeeIds.has(row.employee_id) && row.status === 'completed'
  ).length;
  const branchCount = countByCompany(branches, companyId);
  const departmentCount = countByCompany(departments, companyId);
  const positionCount = countByCompany(positions, companyId);
  const pgrCount = countByCompany(pgrs, companyId, (row) =>
    ['published', 'draft'].includes(row.status || '')
  );
  const publishedPgrCount = countByCompany(pgrs, companyId, (row) => row.status === 'published');
  const actionPlanCount = countByCompany(actionPlans, companyId, (row) =>
    ['active', 'completed'].includes(row.status || '')
  );
  const programCount = countGlobalOrCompany(programs, companyId, (row) => row.status === 'active');
  const lessonCount = countGlobalOrCompany(lessons, companyId, (row) => row.status === 'active');
  const certificateCount = countByCompany(certificates, companyId);
  const dossierCount = countByCompany(dossiers, companyId, (row) => row.status === 'generated');

  const hasEmployees = companyEmployees.length > 0;
  const hasStructure = branchCount > 0 && departmentCount > 0 && positionCount > 0;
  const hasAnyStructure = branchCount > 0 || departmentCount > 0 || positionCount > 0;
  const hasAnyAssessmentForCompany = assessments.some(
    (row) => employeeCompany.get(row.employee_id) === companyId
  );

  const steps: ImplementationStep[] = [
    {
      key: 'company',
      label: 'Empresa cadastrada',
      description: 'Dados jurídicos e vínculo com a clínica registrados.',
      href: '/clinic/companies',
      owner: 'Clínica',
      status: 'completed',
    },
    {
      key: 'branches',
      label: 'Filiais cadastradas',
      description: 'Matriz e unidades vinculadas à empresa.',
      href: '/clinic/quick-onboarding',
      owner: 'Empresa',
      status: buildStatus({ done: branchCount > 0, overdue: oldCompany }),
    },
    {
      key: 'departments',
      label: 'Departamentos cadastrados',
      description: 'Estrutura usada para indicadores e relatórios.',
      href: '/clinic/quick-onboarding',
      owner: 'Empresa',
      status: buildStatus({ done: departmentCount > 0, started: branchCount > 0 }),
    },
    {
      key: 'positions',
      label: 'Cargos cadastrados',
      description: 'Cargos necessários para segmentar riscos e treinamentos.',
      href: '/clinic/quick-onboarding',
      owner: 'Empresa',
      status: buildStatus({ done: positionCount > 0, started: departmentCount > 0 }),
    },
    {
      key: 'employees',
      label: 'Colaboradores importados',
      description: 'Base de pessoas monitoradas no portal.',
      href: '/clinic/quick-onboarding',
      owner: 'Empresa',
      status: buildStatus({ done: hasEmployees, started: hasStructure || hasAnyStructure }),
    },
    {
      key: 'diagnostic',
      label: 'Diagnóstico psicossocial',
      description: 'Primeira avaliação concluída para gerar indicadores.',
      href: '/clinic/diagnostics',
      owner: 'Clínica',
      status: buildStatus({
        done: diagnosticsCount > 0,
        started: hasAnyAssessmentForCompany,
        overdue: hasEmployees && oldCompany,
      }),
    },
    {
      key: 'pgr',
      label: 'PGR criado/publicado',
      description: 'Programa de gerenciamento de riscos da empresa.',
      href: '/clinic/pgr',
      owner: 'Clínica',
      status: buildStatus({
        done: publishedPgrCount > 0,
        started: pgrCount > 0 || diagnosticsCount > 0,
        overdue: diagnosticsCount > 0 && oldCompany,
      }),
    },
    {
      key: 'action-plan',
      label: 'Plano de ação aberto',
      description: 'Ações preventivas/corretivas vinculadas ao risco.',
      href: '/clinic/action-plans',
      owner: 'Clínica',
      status: buildStatus({ done: actionPlanCount > 0, started: publishedPgrCount > 0 }),
    },
    {
      key: 'programs',
      label: 'Programas atribuídos',
      description: 'Programas técnicos disponíveis para a empresa.',
      href: '/clinic/programs',
      owner: 'Clínica',
      status: buildStatus({ done: programCount > 0, started: actionPlanCount > 0 }),
    },
    {
      key: 'classes',
      label: 'Aulas publicadas',
      description: 'Conteúdos prontos para consumo pelos colaboradores.',
      href: '/clinic/classes',
      owner: 'Clínica',
      status: buildStatus({ done: lessonCount > 0, started: programCount > 0 }),
    },
    {
      key: 'certificates',
      label: 'Certificados emitidos',
      description: 'Evidência de conclusão dos treinamentos.',
      href: '/clinic/certificates',
      owner: 'Ambos',
      status: buildStatus({ done: certificateCount > 0, started: lessonCount > 0 }),
    },
    {
      key: 'dossier',
      label: 'Dossiê NR-1 gerado',
      description: 'Pacote auditável da empresa para fiscalização.',
      href: '/clinic/nr1-dossiers',
      owner: 'Clínica',
      status: buildStatus({ done: dossierCount > 0, started: certificateCount > 0 }),
    },
  ];

  const completed = steps.filter((step) => step.status === 'completed').length;
  const nextStep = steps.find((step) => step.status !== 'completed') || null;
  const summary = statusSummary(steps);

  return {
    companyId,
    companyName: company.name,
    progress: Math.round((completed / steps.length) * 100),
    completed,
    total: steps.length,
    nextStep,
    steps,
    ...summary,
  };
}

export async function loadClinicWorkspaceSnapshot(
  supabase: SupabaseServerClient,
  {
    clinicId,
    organizationId,
  }: {
    clinicId: string;
    organizationId: string;
  }
): Promise<ClinicWorkspaceSnapshot> {
  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, name, employee_count, status, created_at')
    .eq('clinic_id', clinicId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const companies = (companiesData || []) as CompanyRow[];
  const companyIds = companies.map((company) => company.id);

  const [
    { data: branchesData },
    { data: departmentsData },
    { data: positionsData },
    { data: employeesData },
    { data: pgrsData },
    { data: actionPlansData },
    { data: programsData },
    { data: lessonsData },
    { data: certificatesData },
    { data: dossiersData },
    { data: helpRequestsData },
    { data: complaintsData },
    { data: technicalCasesData },
    { data: activitiesData },
  ] = await Promise.all([
    companyIds.length
      ? supabase.from('branches').select('id, company_id, status').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? supabase.from('departments').select('id, company_id, status').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? supabase.from('positions').select('id, company_id, status').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? supabase.from('employees').select('id, company_id, status').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    supabase.from('pgr_programs').select('id, company_id, status').eq('clinic_id', clinicId),
    companyIds.length
      ? supabase.from('action_plans').select('id, company_id, status').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    supabase.from('programs').select('id, company_id, status').eq('clinic_id', clinicId),
    supabase.from('lessons').select('id, company_id, status').eq('clinic_id', clinicId),
    supabase.from('certificates').select('id, company_id').eq('clinic_id', clinicId),
    supabase.from('nr1_dossiers').select('id, company_id, status').eq('clinic_id', clinicId),
    supabase.from('help_requests').select('id, company_id, status').eq('clinic_id', clinicId),
    supabase.from('complaints').select('id, company_id, status').eq('clinic_id', clinicId),
    supabase.from('technical_cases').select('id, company_id, status').eq('clinic_id', clinicId),
    supabase
      .from('activity_events')
      .select('id, title, description, event_type, occurred_at')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .limit(8),
  ]);

  const employees = (employeesData || []) as EmployeeRow[];
  const employeeIds = employees.map((employee) => employee.id);
  const { data: assessmentsData } = employeeIds.length
    ? await supabase
        .from('assessments')
        .select('id, employee_id, status')
        .in('employee_id', employeeIds)
    : { data: [] };

  const branches = (branchesData || []) as CompanyScopedRow[];
  const departments = (departmentsData || []) as CompanyScopedRow[];
  const positions = (positionsData || []) as CompanyScopedRow[];
  const assessments = (assessmentsData || []) as AssessmentRow[];
  const pgrs = (pgrsData || []) as CompanyScopedRow[];
  const actionPlans = (actionPlansData || []) as CompanyScopedRow[];
  const programs = (programsData || []) as CompanyScopedRow[];
  const lessons = (lessonsData || []) as CompanyScopedRow[];
  const certificates = (certificatesData || []) as CompanyScopedRow[];
  const dossiers = (dossiersData || []) as CompanyScopedRow[];
  const helpRequests = (helpRequestsData || []) as CompanyScopedRow[];
  const complaints = (complaintsData || []) as CompanyScopedRow[];
  const technicalCases = (technicalCasesData || []) as CompanyScopedRow[];
  const employeeCompany = new Map(employees.map((employee) => [employee.id, employee.company_id]));

  const implementations = companies.map((company) =>
    buildCompanyImplementation({
      company,
      branches,
      departments,
      positions,
      employees,
      assessments,
      employeeCompany,
      pgrs,
      actionPlans,
      programs,
      lessons,
      certificates,
      dossiers,
    })
  );
  const activeCompanies = companies.filter((company) => company.status !== 'inactive').length;
  const averageImplementation = implementations.length
    ? Math.round(
        implementations.reduce((total, item) => total + item.progress, 0) / implementations.length
      )
    : 0;
  const pendingImplementations = implementations.filter((item) => item.progress < 100).length;
  const openCareRequests = helpRequests.filter((item) => item.status !== 'closed').length;
  const openComplaints = complaints.filter((item) => item.status !== 'closed').length;
  const openTechnicalCases = technicalCases.filter((item) =>
    ['open', 'in_progress', 'referred'].includes(item.status || '')
  ).length;

  return {
    metrics: {
      activeCompanies,
      collaborators: employees.length,
      averageImplementation,
      pendingImplementations,
      technicalPendencies:
        pendingImplementations + openCareRequests + openComplaints + openTechnicalCases,
      activePrograms: programs.filter((item) => item.status === 'active').length,
      generatedDossiers: dossiers.filter((item) => item.status === 'generated').length,
      publishedPgrs: pgrs.filter((item) => item.status === 'published').length,
      activeLessons: lessons.filter((item) => item.status === 'active').length,
      certificatesIssued: certificates.length,
      openCareRequests,
      openComplaints,
      openTechnicalCases,
    },
    implementations,
    activities: (activitiesData || []) as ClinicActivity[],
  };
}
