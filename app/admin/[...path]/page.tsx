import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Database, ExternalLink, Plus } from 'lucide-react';
import { PageHeader } from '../../../components/workspace/page-header';
import { WorkspacePanel } from '../../../components/workspace/panel';
import { requireNexxoHubRole } from '../../../lib/nexxohub-context';
import { createAdminClient } from '../../../lib/supabase/admin';

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
type TargetUser = { id: string; email: string; full_name?: string | null };
type AdminRedirectKey = 'access/users' | 'access/roles' | 'modules' | 'integrations';

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
    subtitle: 'Chaves funcionais que liberam ou restringem recursos da plataforma.',
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

function adminSectionRedirect(
  sectionKey: AdminRedirectKey,
  messageKey: 'created' | 'error',
  message: string
): never {
  redirect(`/admin/${sectionKey}?${messageKey}=${encodeURIComponent(message)}`);
}

function defaultNameFromEmail(email: string) {
  const [prefix] = email.split('@');
  return prefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
    .trim();
}

async function recordAdminAudit({
  supabase,
  organizationId,
  userId,
  action,
  resourceType,
  resourceId,
  changes,
}: {
  supabase: Awaited<ReturnType<typeof requireNexxoHubRole>>['supabase'];
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  changes?: Record<string, unknown>;
}) {
  await supabase.from('audit_logs').insert({
    organization_id: organizationId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId || null,
    changes: changes || {},
  });
}

async function findOrCreateTargetUser({
  supabase,
  email,
  fullName,
  temporaryPassword,
  organizationId,
  role,
  createIfMissing,
}: {
  supabase: Awaited<ReturnType<typeof requireNexxoHubRole>>['supabase'];
  email: string;
  fullName: string;
  temporaryPassword: string;
  organizationId: string;
  role: 'admin' | 'manager' | 'user';
  createIfMissing: boolean;
}) {
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('id,email,full_name')
    .ilike('email', email)
    .maybeSingle();

  if (userError) {
    adminAccessRedirect('error', `Nao foi possivel localizar o usuario: ${userError.message}`);
  }

  if (existingUser?.id) {
    if (createIfMissing && temporaryPassword) {
      if (temporaryPassword.length < 12) {
        adminAccessRedirect('error', 'A senha temporaria deve ter pelo menos 12 caracteres.');
      }
      const admin = createAdminClient();
      const { error: passwordError } = await admin.auth.admin.updateUserById(existingUser.id, {
        password: temporaryPassword,
        email_confirm: true,
      });

      if (passwordError) {
        adminAccessRedirect('error', `Nao foi possivel atualizar a senha: ${passwordError.message}`);
      }
    }

    return existingUser as TargetUser;
  }

  if (!createIfMissing) {
    adminAccessRedirect(
      'error',
      'Usuario nao encontrado. Marque a opcao de criar conta ou peca para a pessoa se cadastrar.'
    );
  }

  const displayName = fullName || defaultNameFromEmail(email) || email;
  const admin = createAdminClient();
  const password = temporaryPassword || crypto.randomUUID() + crypto.randomUUID();
  if (password.length < 12) {
    adminAccessRedirect('error', 'A senha temporaria deve ter pelo menos 12 caracteres.');
  }
  const temporaryCnpj = `${Date.now()}${Math.floor(Math.random() * 10)}`.slice(-14);
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: displayName,
      organization_name: 'Convite NexxoHub',
      organization_cnpj: temporaryCnpj,
    },
  });

  if (authError || !authUser.user?.id) {
    adminAccessRedirect(
      'error',
      `Nao foi possivel criar a conta no Auth: ${authError?.message || 'usuario sem id'}`
    );
  }

  const userId = authUser.user.id;
  const [{ data: generatedProfile }, profileMutation, userMutation] = await Promise.all([
    admin.from('users').select('organization_id').eq('id', userId).maybeSingle(),
    admin.from('profiles').upsert({
      id: userId,
      email,
      full_name: displayName,
      organization_id: organizationId,
    }),
    admin.from('users').upsert({
      id: userId,
      email,
      full_name: displayName,
      role,
      organization_id: organizationId,
    }),
  ]);

  if (profileMutation.error || userMutation.error) {
    adminAccessRedirect(
      'error',
      `Conta criada no Auth, mas o perfil nao foi concluido: ${
        profileMutation.error?.message || userMutation.error?.message
      }`
    );
  }

  const generatedOrganizationId =
    generatedProfile && 'organization_id' in generatedProfile
      ? String(generatedProfile.organization_id || '')
      : '';

  if (generatedOrganizationId && generatedOrganizationId !== organizationId) {
    await admin
      .from('portal_memberships')
      .update({ organization_id: organizationId, is_active: false })
      .eq('user_id', userId)
      .eq('organization_id', generatedOrganizationId);
    await admin.from('organizations').delete().eq('id', generatedOrganizationId);
  }

  return { id: userId, email, full_name: displayName } satisfies TargetUser;
}

async function grantAdministrativeAccess(formData: FormData) {
  'use server';

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const fullName = String(formData.get('fullName') || '').trim();
  const temporaryPassword = String(formData.get('temporaryPassword') || '').trim();
  const role = String(formData.get('role') || '');
  const createIfMissing = formData.get('createIfMissing') === 'on';

  if (!email || !email.includes('@')) {
    adminAccessRedirect('error', 'Informe um e-mail valido.');
  }

  if (!adminAccessRoles.some((item) => item.value === role)) {
    adminAccessRedirect('error', 'Selecione um perfil administrativo valido.');
  }

  const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
  const targetUser = await findOrCreateTargetUser({
    supabase,
    email,
    fullName,
    temporaryPassword,
    organizationId: membership.organization_id,
    role: 'admin',
    createIfMissing,
  });

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

  await recordAdminAudit({
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
    action: existingAccess?.id ? 'admin_access.updated' : 'admin_access.created',
    resourceType: 'portal_memberships',
    resourceId: existingAccess?.id || targetUser.id,
    changes: { email, role, portal: 'nexxohub' },
  });

  revalidatePath('/admin/access/users');
  adminAccessRedirect(
    'created',
    createIfMissing
      ? 'Conta criada/atualizada e acesso administrativo registrado.'
      : 'Acesso administrativo registrado.'
  );
}

async function grantPortalAccess(formData: FormData) {
  'use server';

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const fullName = String(formData.get('fullName') || '').trim();
  const temporaryPassword = String(formData.get('temporaryPassword') || '').trim();
  const portal = String(formData.get('portal') || '') as PortalAccessType;
  const role = String(formData.get('role') || '');
  const clinicId = String(formData.get('clinicId') || '').trim() || null;
  const companyId = String(formData.get('companyId') || '').trim() || null;
  const employeeId = String(formData.get('employeeId') || '').trim() || null;
  const createIfMissing = formData.get('createIfMissing') === 'on';

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
  const targetUser = await findOrCreateTargetUser({
    supabase,
    email,
    fullName,
    temporaryPassword,
    organizationId: membership.organization_id,
    role: portal === 'employee' ? 'user' : 'manager',
    createIfMissing,
  });

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

  await recordAdminAudit({
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
    action: existingAccess?.id ? 'portal_access.updated' : 'portal_access.created',
    resourceType: 'portal_memberships',
    resourceId: existingAccess?.id || targetUser.id,
    changes: { email, portal, role, clinicId, companyId: scopedCompanyId, employeeId: scopedEmployeeId },
  });

  revalidatePath('/admin/access/users');
  adminAccessRedirect(
    'created',
    createIfMissing
      ? 'Conta criada/atualizada e acesso do portal registrado.'
      : 'Acesso do portal registrado.'
  );
}

async function createRole(formData: FormData) {
  'use server';

  const name = String(formData.get('name') || '').trim();
  const roleKey = String(formData.get('roleKey') || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const portal = String(formData.get('portal') || '').trim();
  const description = String(formData.get('description') || '').trim();

  if (!name || !roleKey || !portal) {
    adminSectionRedirect('access/roles', 'error', 'Informe nome, chave e portal do perfil.');
  }

  if (!['nexxohub', 'clinic', 'company', 'employee'].includes(portal)) {
    adminSectionRedirect('access/roles', 'error', 'Portal invalido para o perfil.');
  }

  const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
  const mutation = await supabase.from('roles').upsert(
    {
      organization_id: membership.organization_id,
      name,
      role_key: roleKey,
      portal,
      description: description || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,role_key' }
  );

  if (mutation.error) {
    adminSectionRedirect('access/roles', 'error', `Nao foi possivel salvar o perfil: ${mutation.error.message}`);
  }

  await recordAdminAudit({
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
    action: 'role.upserted',
    resourceType: 'roles',
    resourceId: roleKey,
    changes: { name, roleKey, portal, description },
  });

  revalidatePath('/admin/access/roles');
  adminSectionRedirect('access/roles', 'created', 'Perfil salvo e disponivel para governanca.');
}

async function upsertModuleSetting(formData: FormData) {
  'use server';

  const moduleKey = String(formData.get('moduleKey') || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const label = String(formData.get('label') || '').trim();
  const enabled = formData.get('enabled') === 'on';
  const sensitive = formData.get('sensitive') === 'on';

  if (!moduleKey || !label) {
    adminSectionRedirect('modules', 'error', 'Informe a chave e o nome do modulo.');
  }

  const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
  const key = moduleKey.startsWith('module.') ? moduleKey : `module.${moduleKey}`;
  const value = {
    label,
    enabled,
    managedBy: 'admin-central',
    updatedAt: new Date().toISOString(),
  };
  const mutation = await supabase.from('settings').upsert(
    {
      tenant_id: membership.organization_id,
      key,
      value,
      is_sensitive: sensitive,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id,key' }
  );

  if (mutation.error) {
    adminSectionRedirect('modules', 'error', `Nao foi possivel salvar o modulo: ${mutation.error.message}`);
  }

  await recordAdminAudit({
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
    action: 'module_setting.upserted',
    resourceType: 'settings',
    resourceId: key,
    changes: value,
  });

  revalidatePath('/admin/modules');
  adminSectionRedirect('modules', 'created', 'Modulo configurado com sucesso.');
}

async function upsertIntegrationSetting(formData: FormData) {
  'use server';

  const provider = String(formData.get('provider') || '').trim();
  const scope = String(formData.get('scope') || '').trim();
  const clinicId = String(formData.get('clinicId') || '').trim() || null;
  const enabled = formData.get('enabled') === 'on';
  const secretRef = String(formData.get('secretRef') || '').trim() || null;

  if (!['asaas', 'vimeo', 'claude', 'email', 'webhook'].includes(provider)) {
    adminSectionRedirect('integrations', 'error', 'Selecione um provedor valido.');
  }

  if (!['global', 'clinic'].includes(scope)) {
    adminSectionRedirect('integrations', 'error', 'Selecione um escopo valido.');
  }

  if (scope === 'clinic' && !clinicId) {
    adminSectionRedirect('integrations', 'error', 'Selecione uma clinica para integracao de escopo clinico.');
  }

  const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
  const payload = {
    organization_id: membership.organization_id,
    clinic_id: scope === 'clinic' ? clinicId : null,
    provider,
    scope,
    is_enabled: enabled,
    config: { managedBy: 'admin-central' },
    secret_ref: secretRef,
    created_by: user.id,
    updated_at: new Date().toISOString(),
  };
  let existingQuery = supabase
    .from('integration_settings')
    .select('id')
    .eq('provider', provider)
    .eq('scope', scope)
    .eq('organization_id', membership.organization_id);
  existingQuery =
    scope === 'clinic' && clinicId ? existingQuery.eq('clinic_id', clinicId) : existingQuery.is('clinic_id', null);
  const existingResult = await existingQuery.maybeSingle();

  if (existingResult.error) {
    adminSectionRedirect(
      'integrations',
      'error',
      `Nao foi possivel verificar a integracao atual: ${existingResult.error.message}`
    );
  }

  const mutation = existingResult.data?.id
    ? await supabase.from('integration_settings').update(payload).eq('id', existingResult.data.id)
    : await supabase.from('integration_settings').insert(payload);

  if (mutation.error) {
    adminSectionRedirect(
      'integrations',
      'error',
      `Nao foi possivel salvar a integracao: ${mutation.error.message}`
    );
  }

  await recordAdminAudit({
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
    action: 'integration_setting.upserted',
    resourceType: 'integration_settings',
    resourceId: `${provider}:${scope}`,
    changes: { provider, scope, clinicId, enabled, hasSecretRef: Boolean(secretRef) },
  });

  revalidatePath('/admin/integrations');
  adminSectionRedirect('integrations', 'created', 'Integracao configurada com sucesso.');
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
  } else if (key === 'integrations') {
    portalReferenceRows = await getPortalReferenceRows(supabase);
    errorMessage = portalReferenceRows.errorMessage;
    if (!errorMessage && section.table && section.select) {
      let query = supabase.from(section.table).select(section.select).limit(100);
      if (section.order) query = query.order(section.order, { ascending: false });
      const result = await query;
      rows = (result.data || []) as unknown as Record<string, unknown>[];
      errorMessage = result.error?.message || '';
    }
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

      {key !== 'access/users' && resolvedSearchParams.created && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {resolvedSearchParams.created}
        </p>
      )}
      {key !== 'access/users' && resolvedSearchParams.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {resolvedSearchParams.error}
        </p>
      )}

      {key === 'access/users' && (
        <WorkspacePanel title="Registrar acesso administrativo">
          <form
            action={grantAdministrativeAccess}
            className="grid gap-4 lg:grid-cols-[1fr_1fr_240px_auto] lg:items-end"
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
              <label
                htmlFor="fullName"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Nome do usuario
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Nome completo"
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

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 lg:col-span-4">
              <input
                name="createIfMissing"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Criar conta automaticamente se o e-mail ainda nao existir
            </label>

            <div className="lg:col-span-4">
              <label
                htmlFor="temporaryPassword"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Senha temporaria
              </label>
              <input
                id="temporaryPassword"
                name="temporaryPassword"
                type="text"
                minLength={12}
                placeholder="Opcional ao criar/atualizar conta"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            Ao marcar a criacao automatica, informe uma senha temporaria com pelo menos 12
            caracteres ou deixe em branco para exigir redefinicao posterior.
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
              <label
                htmlFor="portal-fullName"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Nome do usuario
              </label>
              <input
                id="portal-fullName"
                name="fullName"
                type="text"
                placeholder="Nome completo"
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
              <label className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  name="createIfMissing"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                Criar conta automaticamente se o e-mail ainda nao existir
              </label>

              <div className="mb-4">
                <label
                  htmlFor="portal-temporaryPassword"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Senha temporaria
                </label>
                <input
                  id="portal-temporaryPassword"
                  name="temporaryPassword"
                  type="text"
                  minLength={12}
                  placeholder="Opcional ao criar/atualizar conta"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Registrar acesso do portal
              </button>
              <p className="mt-3 text-xs text-slate-500">
                Para homologacao completa, conceda ao usuario pelo menos acesso de Clinica. Empresa
                e Colaborador exigem tambem os respectivos escopos. Senha temporaria permite login
                imediato.
              </p>
            </div>
          </form>
        </WorkspacePanel>
      )}

      {key === 'access/roles' && (
        <WorkspacePanel title="Criar ou atualizar perfil">
          <form action={createRole} className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
            <div>
              <label htmlFor="role-name" className="mb-2 block text-xs font-semibold text-slate-600">
                Nome do perfil
              </label>
              <input
                id="role-name"
                name="name"
                required
                placeholder="Ex.: Auditor NR-1"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label htmlFor="role-key" className="mb-2 block text-xs font-semibold text-slate-600">
                Chave
              </label>
              <input
                id="role-key"
                name="roleKey"
                required
                placeholder="auditor_nr1"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label htmlFor="role-portal" className="mb-2 block text-xs font-semibold text-slate-600">
                Portal
              </label>
              <select
                id="role-portal"
                name="portal"
                defaultValue="company"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="nexxohub">NexxoHub</option>
                <option value="clinic">Clinica</option>
                <option value="company">Empresa</option>
                <option value="employee">Colaborador</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Salvar perfil
            </button>

            <div className="lg:col-span-4">
              <label htmlFor="role-description" className="mb-2 block text-xs font-semibold text-slate-600">
                Descricao
              </label>
              <input
                id="role-description"
                name="description"
                placeholder="Responsabilidades e limite de acesso deste perfil"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </form>
        </WorkspacePanel>
      )}

      {key === 'modules' && (
        <WorkspacePanel title="Configurar modulo funcional">
          <form action={upsertModuleSetting} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <label htmlFor="module-key" className="mb-2 block text-xs font-semibold text-slate-600">
                Chave do modulo
              </label>
              <input
                id="module-key"
                name="moduleKey"
                required
                placeholder="nr1.dossie"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label htmlFor="module-label" className="mb-2 block text-xs font-semibold text-slate-600">
                Nome exibido
              </label>
              <input
                id="module-label"
                name="label"
                required
                placeholder="Dossie NR-1"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Salvar modulo
            </button>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                name="enabled"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                name="sensitive"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Configuracao sensivel
            </label>
          </form>
        </WorkspacePanel>
      )}

      {key === 'integrations' && (
        <WorkspacePanel title="Configurar integracao">
          <form action={upsertIntegrationSetting} className="grid gap-4 lg:grid-cols-[180px_180px_1fr_1fr_auto] lg:items-end">
            <div>
              <label htmlFor="integration-provider" className="mb-2 block text-xs font-semibold text-slate-600">
                Provedor
              </label>
              <select
                id="integration-provider"
                name="provider"
                defaultValue="email"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="email">Email</option>
                <option value="webhook">Webhook</option>
                <option value="asaas">Asaas</option>
                <option value="vimeo">Vimeo</option>
                <option value="claude">Claude</option>
              </select>
            </div>

            <div>
              <label htmlFor="integration-scope" className="mb-2 block text-xs font-semibold text-slate-600">
                Escopo
              </label>
              <select
                id="integration-scope"
                name="scope"
                defaultValue="global"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="global">Global</option>
                <option value="clinic">Clinica</option>
              </select>
            </div>

            <div>
              <label htmlFor="integration-clinic" className="mb-2 block text-xs font-semibold text-slate-600">
                Clinica
              </label>
              <select
                id="integration-clinic"
                name="clinicId"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">Somente para escopo clinico</option>
                {portalReferenceRows.clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="integration-secret" className="mb-2 block text-xs font-semibold text-slate-600">
                Referencia secreta
              </label>
              <input
                id="integration-secret"
                name="secretRef"
                placeholder="Ex.: netlify:ASAAS_API_KEY"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Salvar
            </button>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 lg:col-span-5">
              <input
                name="enabled"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Integracao ativa
            </label>
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
