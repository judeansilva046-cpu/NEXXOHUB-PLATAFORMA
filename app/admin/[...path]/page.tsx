import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Database, ExternalLink, Plus } from 'lucide-react';
import { PageHeader } from '../../../components/workspace/page-header';
import { WorkspacePanel } from '../../../components/workspace/panel';
import { requireNexxoHubRole } from '../../../lib/nexxohub-context';

const adminAccessRoles = [
  { value: 'nexxohub_admin', label: 'Super administrador' },
  { value: 'nexxohub_finance', label: 'Financeiro' },
  { value: 'nexxohub_operator', label: 'Operador' },
] as const;

const portalAccessRoles = {
  clinic: [
    { value: 'clinic_admin', label: 'Clinica - Administrador' },
    { value: 'clinic_staff', label: 'Clinica - Equipe' },
  ],
  company: [
    { value: 'company_admin', label: 'Empresa - Administrador' },
    { value: 'company_hr', label: 'Empresa - RH' },
    { value: 'company_compliance', label: 'Empresa - Compliance' },
    { value: 'company_manager', label: 'Empresa - Gestor' },
    { value: 'company_director', label: 'Empresa - Diretor' },
  ],
  employee: [{ value: 'employee', label: 'Colaborador' }],
} as const;

type PortalAccessType = keyof typeof portalAccessRoles;
type ReferenceRow = { id: string; name: string };

type Section = {
  title: string;
  subtitle: string;
  table?: string;
  select?: string;
  order?: string;
  columns?: Array<[string, string]>;
  target?: string;
};

const sections: Record<string, Section> = {
  'access/users': {
    title: 'Usuarios administrativos',
    subtitle: 'Contas internas com acesso ao NexxoHub.',
    table: 'portal_memberships',
    select: 'id,user_id,role,is_active,created_at',
    order: 'created_at',
    columns: [
      ['user', 'Usuario'],
      ['portal', 'Portal'],
      ['role', 'Perfil'],
      ['scope', 'Escopo'],
      ['is_active', 'Ativo'],
      ['created_at', 'Criado em'],
    ],
  },
  'access/roles': {
    title: 'Perfis e permissoes',
    subtitle: 'Perfis RBAC persistidos para a organizacao.',
    table: 'roles',
    select: 'id,name,role_key,portal,description,created_at',
    order: 'created_at',
    columns: [
      ['name', 'Perfil'],
      ['role_key', 'Chave'],
      ['portal', 'Portal'],
      ['description', 'Descricao'],
    ],
  },
  'access/sessions': {
    title: 'Sessoes e dispositivos',
    subtitle: 'Eventos reais de autenticacao e seguranca.',
    table: 'audit_logs',
    select: 'id,action,resource_type,ip_address,created_at',
    order: 'created_at',
    columns: [
      ['action', 'Acao'],
      ['resource_type', 'Recurso'],
      ['ip_address', 'IP'],
      ['created_at', 'Data'],
    ],
  },
  clinics: {
    title: 'Clinicas',
    subtitle: 'Clinicas cadastradas e seus estados atuais.',
    table: 'clinics',
    select: 'id,name,cnpj,status,created_at',
    order: 'created_at',
    columns: [
      ['name', 'Clinica'],
      ['cnpj', 'CNPJ'],
      ['status', 'Status'],
      ['created_at', 'Cadastro'],
    ],
  },
  'internal-users': {
    title: 'Usuarios internos',
    subtitle: 'Equipe administrativa da plataforma.',
    target: '/admin/access/users',
  },
  plans: {
    title: 'Planos',
    subtitle: 'Planos comerciais reais disponiveis para assinatura.',
    table: 'billing_plans',
    select: 'id,name,code,monthly_price,is_active,created_at',
    order: 'created_at',
    columns: [
      ['name', 'Plano'],
      ['code', 'Codigo'],
      ['monthly_price', 'Mensalidade'],
      ['is_active', 'Ativo'],
    ],
  },
  contracts: {
    title: 'Contratos',
    subtitle: 'Contratos comerciais da plataforma.',
    target: '/dashboard/contracts',
  },
  subscriptions: {
    title: 'Assinaturas',
    subtitle: 'Assinaturas e ciclos de vigencia.',
    table: 'subscriptions',
    select: 'id,status,starts_on,ends_on,created_at,billing_plans(name)',
    order: 'created_at',
    columns: [
      ['billing_plans', 'Plano'],
      ['status', 'Status'],
      ['starts_on', 'Inicio'],
      ['ends_on', 'Termino'],
    ],
  },
  billing: {
    title: 'Cobrancas e pagamentos',
    subtitle: 'Central financeira real.',
    target: '/finance',
  },
  blocks: {
    title: 'Bloqueios e suspensoes',
    subtitle: 'Contratos suspensos com rastreabilidade.',
    table: 'contracts',
    select: 'id,contract_number,status,notes,updated_at',
    order: 'updated_at',
    columns: [
      ['contract_number', 'Contrato'],
      ['status', 'Status'],
      ['notes', 'Motivo'],
      ['updated_at', 'Atualizacao'],
    ],
  },
  modules: {
    title: 'Modulos e permissoes',
    subtitle: 'Configuracoes funcionais persistidas.',
    table: 'settings',
    select: 'id,key,value,is_sensitive,updated_at',
    order: 'updated_at',
    columns: [
      ['key', 'Configuracao'],
      ['value', 'Valor'],
      ['is_sensitive', 'Sensivel'],
      ['updated_at', 'Atualizacao'],
    ],
  },
  integrations: {
    title: 'Integracoes',
    subtitle: 'Conexoes e provedores configurados.',
    table: 'integration_settings',
    select: 'id,provider,scope,is_enabled,updated_at',
    order: 'updated_at',
    columns: [
      ['provider', 'Provedor'],
      ['scope', 'Escopo'],
      ['is_enabled', 'Ativa'],
      ['updated_at', 'Atualizacao'],
    ],
  },
  automations: {
    title: 'Automacoes',
    subtitle: 'Execucoes registradas pelas rotinas da plataforma.',
    table: 'integration_sync_logs',
    select: 'id,operation,status,attempt_count,error_message,created_at',
    order: 'created_at',
    columns: [
      ['operation', 'Operacao'],
      ['status', 'Status'],
      ['attempt_count', 'Tentativas'],
      ['error_message', 'Erro'],
    ],
  },
  monitoring: {
    title: 'Monitoramento',
    subtitle: 'Alertas reais emitidos pelos servicos.',
    table: 'smart_alerts',
    select: 'id,title,severity,status,detected_at',
    order: 'detected_at',
    columns: [
      ['title', 'Alerta'],
      ['severity', 'Severidade'],
      ['status', 'Status'],
      ['detected_at', 'Detectado em'],
    ],
  },
  audit: {
    title: 'Auditoria',
    subtitle: 'Trilha imutavel das acoes administrativas.',
    table: 'audit_logs',
    select: 'id,action,resource_type,resource_id,created_at',
    order: 'created_at',
    columns: [
      ['action', 'Acao'],
      ['resource_type', 'Recurso'],
      ['resource_id', 'Identificador'],
      ['created_at', 'Data'],
    ],
  },
  security: {
    title: 'Seguranca',
    subtitle: 'Eventos de acesso e alteracoes sensiveis.',
    table: 'audit_logs',
    select: 'id,action,ip_address,user_agent,created_at',
    order: 'created_at',
    columns: [
      ['action', 'Evento'],
      ['ip_address', 'IP'],
      ['user_agent', 'Dispositivo'],
      ['created_at', 'Data'],
    ],
  },
};

function adminAccessRedirect(messageKey: 'created' | 'error', message: string): never {
  redirect(`/admin/access/users?${messageKey}=${encodeURIComponent(message)}`);
}

async function grantAdministrativeAccess(formData: FormData) {
  'use server';

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const role = String(formData.get('role') || '');

  if (!email || !email.includes('@')) {
    adminAccessRedirect('error', 'Informe um e-mail valido.');
  }

  if (!adminAccessRoles.some((item) => item.value === role)) {
    adminAccessRedirect('error', 'Selecione um perfil administrativo valido.');
  }

  const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id,email,full_name')
    .ilike('email', email)
    .maybeSingle();

  if (userError) {
    adminAccessRedirect('error', `Nao foi possivel localizar o usuario: ${userError.message}`);
  }

  if (!targetUser?.id) {
    adminAccessRedirect(
      'error',
      'Usuario nao encontrado. Primeiro crie a conta pelo cadastro/login e depois conceda o acesso.'
    );
  }

  const { data: existingAccess, error: existingError } = await supabase
    .from('portal_memberships')
    .select('id')
    .eq('user_id', targetUser.id)
    .eq('portal', 'nexxohub')
    .maybeSingle();

  if (existingError) {
    adminAccessRedirect(
      'error',
      `Nao foi possivel verificar o acesso atual: ${existingError.message}`
    );
  }

  const mutation = existingAccess?.id
    ? await supabase
        .from('portal_memberships')
        .update({
          role,
          is_active: true,
          organization_id: membership.organization_id,
        })
        .eq('id', existingAccess.id)
    : await supabase.from('portal_memberships').insert({
        user_id: targetUser.id,
        portal: 'nexxohub',
        role,
        organization_id: membership.organization_id,
        clinic_id: null,
        company_id: null,
        employee_id: null,
        is_active: true,
        created_by: user.id,
      });

  if (mutation.error) {
    adminAccessRedirect('error', `Nao foi possivel registrar o acesso: ${mutation.error.message}`);
  }

  revalidatePath('/admin/access/users');
  adminAccessRedirect('created', 'Acesso administrativo registrado.');
}

async function grantPortalAccess(formData: FormData) {
  'use server';

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const portal = String(formData.get('portal') || '') as PortalAccessType;
  const role = String(formData.get('role') || '');
  const clinicId = String(formData.get('clinicId') || '').trim() || null;
  const companyId = String(formData.get('companyId') || '').trim() || null;
  const employeeId = String(formData.get('employeeId') || '').trim() || null;

  if (!email || !email.includes('@')) {
    adminAccessRedirect('error', 'Informe um e-mail valido.');
  }

  if (!Object.keys(portalAccessRoles).includes(portal)) {
    adminAccessRedirect('error', 'Selecione um portal valido.');
  }

  const allowedRoles = portalAccessRoles[portal].map((item) => item.value);
  if (!allowedRoles.includes(role as never)) {
    adminAccessRedirect('error', 'Selecione um perfil valido para o portal.');
  }

  if (!clinicId) {
    adminAccessRedirect('error', 'Selecione uma clinica para o acesso do portal.');
  }

  if ((portal === 'company' || portal === 'employee') && !companyId) {
    adminAccessRedirect('error', 'Selecione uma empresa para este acesso.');
  }

  if (portal === 'employee' && !employeeId) {
    adminAccessRedirect('error', 'Selecione um colaborador para este acesso.');
  }

  const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id,email,full_name')
    .ilike('email', email)
    .maybeSingle();

  if (userError) {
    adminAccessRedirect('error', `Nao foi possivel localizar o usuario: ${userError.message}`);
  }

  if (!targetUser?.id) {
    adminAccessRedirect(
      'error',
      'Usuario nao encontrado. Primeiro crie a conta pelo cadastro/login e depois conceda o acesso.'
    );
  }

  if (portal === 'company' || portal === 'employee') {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id,clinic_id,organization_id')
      .eq('id', companyId)
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (companyError || !company) {
      adminAccessRedirect('error', 'Empresa nao encontrada para a clinica selecionada.');
    }
  }

  if (portal === 'employee') {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id,company_id')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (employeeError || !employee) {
      adminAccessRedirect('error', 'Colaborador nao encontrado para a empresa selecionada.');
    }
  }

  const scopedCompanyId = portal === 'clinic' ? null : companyId;
  const scopedEmployeeId = portal === 'employee' ? employeeId : null;
  let existingAccessQuery = supabase
    .from('portal_memberships')
    .select('id')
    .eq('user_id', targetUser.id)
    .eq('portal', portal)
    .eq('clinic_id', clinicId);

  existingAccessQuery = scopedCompanyId
    ? existingAccessQuery.eq('company_id', scopedCompanyId)
    : existingAccessQuery.is('company_id', null);
  existingAccessQuery = scopedEmployeeId
    ? existingAccessQuery.eq('employee_id', scopedEmployeeId)
    : existingAccessQuery.is('employee_id', null);

  const { data: existingAccess, error: existingError } = await existingAccessQuery.maybeSingle();

  if (existingError) {
    adminAccessRedirect(
      'error',
      `Nao foi possivel verificar o acesso atual: ${existingError.message}`
    );
  }

  const payload = {
    user_id: targetUser.id,
    portal,
    role,
    organization_id: membership.organization_id,
    clinic_id: clinicId,
    company_id: scopedCompanyId,
    employee_id: scopedEmployeeId,
    is_active: true,
    created_by: user.id,
  };

  const mutation = existingAccess?.id
    ? await supabase
        .from('portal_memberships')
        .update({
          role,
          is_active: true,
          organization_id: membership.organization_id,
        })
        .eq('id', existingAccess.id)
    : await supabase.from('portal_memberships').insert(payload);

  if (mutation.error) {
    adminAccessRedirect('error', `Nao foi possivel registrar o acesso: ${mutation.error.message}`);
  }

  revalidatePath('/admin/access/users');
  adminAccessRedirect('created', 'Acesso do portal registrado.');
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao';
  if (typeof value === 'object') {
    const data = Array.isArray(value) ? value[0] : value;
    if (data && typeof data === 'object' && 'full_name' in data) {
      const record = data as { full_name?: unknown; email?: unknown };
      return `${String(record.full_name || '')}${record.email ? ` - ${String(record.email)}` : ''}`;
    }
    if (data && typeof data === 'object' && 'name' in data) {
      return String((data as { name?: unknown }).name);
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleString('pt-BR');
  }
  return String(value);
}

async function getAdminAccessRows(
  supabase: Awaited<ReturnType<typeof requireNexxoHubRole>>['supabase']
) {
  const membershipResult = await supabase
    .from('portal_memberships')
    .select('id,user_id,portal,role,is_active,created_at,clinic_id,company_id,employee_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (membershipResult.error) {
    return { rows: [], errorMessage: membershipResult.error.message };
  }

  const memberships = (membershipResult.data || []) as Array<Record<string, unknown>>;
  const userIds = memberships.map((membership) => String(membership.user_id || '')).filter(Boolean);
  const userResult =
    userIds.length > 0
      ? await supabase.from('users').select('id,full_name,email').in('id', userIds)
      : { data: [], error: null };

  if (userResult.error) {
    return { rows: [], errorMessage: userResult.error.message };
  }

  const usersById = new Map(
    ((userResult.data || []) as Array<Record<string, unknown>>).map((item) => [
      String(item.id),
      item,
    ])
  );

  return {
    rows: memberships.map((membership) => ({
      ...membership,
      scope: [
        membership.clinic_id ? `Clinica ${String(membership.clinic_id).slice(0, 8)}` : '',
        membership.company_id ? `Empresa ${String(membership.company_id).slice(0, 8)}` : '',
        membership.employee_id ? `Colaborador ${String(membership.employee_id).slice(0, 8)}` : '',
      ]
        .filter(Boolean)
        .join(' / '),
      user: usersById.get(String(membership.user_id)) || {
        full_name: 'Usuario sem perfil',
        email: String(membership.user_id || ''),
      },
    })),
    errorMessage: '',
  };
}

async function getPortalReferenceRows(
  supabase: Awaited<ReturnType<typeof requireNexxoHubRole>>['supabase']
) {
  const [clinicsResult, companiesResult, employeesResult] = await Promise.all([
    supabase
      .from('clinics')
      .select('id,name')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('companies')
      .select('id,name')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('employees')
      .select('id,full_name')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return {
    clinics: ((clinicsResult.data || []) as Array<{ id: string; name: string }>).map((item) => ({
      id: item.id,
      name: item.name,
    })),
    companies: ((companiesResult.data || []) as Array<{ id: string; name: string }>).map(
      (item) => ({
        id: item.id,
        name: item.name,
      })
    ),
    employees: ((employeesResult.data || []) as Array<{ id: string; full_name: string }>).map(
      (item) => ({
        id: item.id,
        name: item.full_name,
      })
    ),
    errorMessage:
      clinicsResult.error?.message || companiesResult.error?.message || employeesResult.error?.message || '',
  };
}

export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams?: Promise<{ created?: string; error?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const key = (resolvedParams.path || []).join('/');
  const section = sections[key];
  if (!section) redirect('/admin');
  if (section.target) redirect(section.target);

  const { supabase } = await requireNexxoHubRole([
    'nexxohub_admin',
    'nexxohub_finance',
    'nexxohub_operator',
  ]);
  let rows: Record<string, unknown>[] = [];
  let errorMessage = '';
  let portalReferenceRows: {
    clinics: ReferenceRow[];
    companies: ReferenceRow[];
    employees: ReferenceRow[];
    errorMessage: string;
  } = {
    clinics: [],
    companies: [],
    employees: [],
    errorMessage: '',
  };

  if (key === 'access/users') {
    const [result, references] = await Promise.all([
      getAdminAccessRows(supabase),
      getPortalReferenceRows(supabase),
    ]);
    rows = result.rows;
    portalReferenceRows = references;
    errorMessage = result.errorMessage || references.errorMessage;
  } else if (section.table && section.select) {
    let query = supabase.from(section.table).select(section.select).limit(100);
    if (section.order) query = query.order(section.order, { ascending: false });
    if (key === 'blocks') query = query.eq('status', 'suspended');
    const result = await query;
    rows = (result.data || []) as unknown as Record<string, unknown>[];
    errorMessage = result.error?.message || '';
  }

  return (
    <div className="space-y-4">
      <PageHeader title={section.title} subtitle={section.subtitle} userName="NexxoHub Admin" />

      {key === 'access/users' && (
        <WorkspacePanel title="Registrar acesso administrativo">
          <form
            action={grantAdministrativeAccess}
            className="grid gap-4 lg:grid-cols-[1fr_240px_auto] lg:items-end"
          >
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-600">
                E-mail do usuario
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nome@empresa.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-2 block text-xs font-semibold text-slate-600">
                Perfil
              </label>
              <select
                id="role"
                name="role"
                defaultValue="nexxohub_operator"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                {adminAccessRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Registrar acesso
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            O usuario precisa existir no cadastro da plataforma. Este formulario concede ou reativa
            o acesso ao Admin Central.
          </p>

          {resolvedSearchParams.created && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {resolvedSearchParams.created}
            </p>
          )}
          {resolvedSearchParams.error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {resolvedSearchParams.error}
            </p>
          )}
        </WorkspacePanel>
      )}

      {key === 'access/users' && (
        <WorkspacePanel title="Registrar acesso aos portais">
          <form action={grantPortalAccess} className="grid gap-4 lg:grid-cols-3">
            <div>
              <label
                htmlFor="portal-email"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                E-mail do usuario
              </label>
              <input
                id="portal-email"
                name="email"
                type="email"
                required
                placeholder="nome@empresa.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label htmlFor="portal" className="mb-2 block text-xs font-semibold text-slate-600">
                Portal
              </label>
              <select
                id="portal"
                name="portal"
                defaultValue="clinic"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="clinic">Clinica</option>
                <option value="company">Empresa</option>
                <option value="employee">Colaborador</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="portal-role"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Perfil
              </label>
              <select
                id="portal-role"
                name="role"
                defaultValue="clinic_admin"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                {Object.entries(portalAccessRoles).map(([portalName, roles]) => (
                  <optgroup key={portalName} label={portalName}>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="clinicId"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Clinica
              </label>
              <select
                id="clinicId"
                name="clinicId"
                required
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">Selecione</option>
                {portalReferenceRows.clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="companyId"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Empresa
              </label>
              <select
                id="companyId"
                name="companyId"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">Somente para Empresa/Colaborador</option>
                {portalReferenceRows.companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Colaborador
              </label>
              <select
                id="employeeId"
                name="employeeId"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">Somente para Colaborador</option>
                {portalReferenceRows.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Registrar acesso do portal
              </button>
              <p className="mt-3 text-xs text-slate-500">
                Para homologacao completa, conceda ao usuario pelo menos acesso de Clinica. Empresa
                e Colaborador exigem tambem os respectivos escopos.
              </p>
            </div>
          </form>
        </WorkspacePanel>
      )}

      <WorkspacePanel title={`${rows.length} registro${rows.length === 1 ? '' : 's'}`}>
        {errorMessage ? (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Nao foi possivel consultar: {errorMessage}
          </p>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            <Database className="mx-auto mb-3 h-8 w-8" />
            <p className="text-sm font-medium">Nenhum registro cadastrado</p>
            <p className="mt-1 text-xs">
              A tela esta conectada ao banco e nao exibe dados de demonstracao.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-500">
                  {section.columns?.map(([, label]) => (
                    <th key={label} className="px-3 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={String(row.id || index)} className="border-b border-slate-100">
                    {section.columns?.map(([field]) => (
                      <td key={field} className="max-w-xs px-3 py-3 text-slate-700">
                        {display(row[field])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WorkspacePanel>

      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-medium text-cyan-700"
      >
        Voltar ao dashboard <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
