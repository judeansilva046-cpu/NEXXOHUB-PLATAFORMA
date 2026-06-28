import { NextRequest, NextResponse } from 'next/server';
import { getErrorResponse, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errors';
import { requirePortalContext, type PortalMembership } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { firstRelation, type SupabaseRelation } from '@/lib/supabase-relations';
import {
  branchRecordSchema,
  departmentRecordSchema,
  employeeRecordSchema,
  isCompanyOrganizationResource,
  positionRecordSchema,
  statusUpdateSchema,
  type CompanyOrganizationResource,
} from '@/lib/validations/company-organization-records';

type Context = { params: { resource: string } };
type CompanyScope = {
  id: string;
  organization_id: string;
  clinic_id: string;
  name: string;
};
type CompanyContext = Awaited<ReturnType<typeof requirePortalContext>> & {
  company: CompanyScope;
};
type Row = Record<string, unknown>;
type RelatedName = { id: string; name: string; cbo_code?: string | null };

const writableRoles = new Set(['company_admin', 'company_hr']);

const resourceSelect: Record<CompanyOrganizationResource, string> = {
  branches: 'id, name, cnpj, city, state, address, status, created_at, updated_at',
  departments: 'id, name, branch_id, status, created_at, updated_at, branches(id, name)',
  positions:
    'id, name, cbo_code, department_id, status, created_at, updated_at, departments(id, name)',
  employees:
    'id, full_name, email, cpf, registration, position, department, phone, admission_date, branch_id, department_id, position_id, status, created_at, updated_at, branches(id, name), departments(id, name), positions(id, name, cbo_code)',
};

const entityTypes: Record<CompanyOrganizationResource, string> = {
  branches: 'branch',
  departments: 'department',
  positions: 'position',
  employees: 'employee',
};

function assertResource(resource: string) {
  if (!isCompanyOrganizationResource(resource)) {
    throw new NotFoundError('Recurso organizacional');
  }
  return resource;
}

function canWrite(membership: PortalMembership) {
  return writableRoles.has(String(normalizeRole(membership.role)));
}

function nullable(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getBodyRecordId(body: unknown) {
  const candidate =
    body && typeof body === 'object' && 'id' in body ? (body as { id?: unknown }).id : undefined;

  if (typeof candidate !== 'string' || !candidate) {
    throw new ValidationError('Identificador do registro não informado.', 'id');
  }

  return candidate;
}

function relationName(row: Row, key: string) {
  return firstRelation(row[key] as SupabaseRelation<RelatedName> | undefined)?.name || null;
}

function mapRecord(resource: CompanyOrganizationResource, row: Row) {
  if (resource === 'branches') {
    return {
      id: String(row.id),
      name: String(row.name || ''),
      cnpj: (row.cnpj as string | null) || null,
      city: (row.city as string | null) || null,
      state: (row.state as string | null) || null,
      address: (row.address as string | null) || null,
      status: String(row.status || 'active'),
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || ''),
    };
  }

  if (resource === 'departments') {
    return {
      id: String(row.id),
      name: String(row.name || ''),
      branch_id: (row.branch_id as string | null) || null,
      branch_name: relationName(row, 'branches'),
      status: String(row.status || 'active'),
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || ''),
    };
  }

  if (resource === 'positions') {
    return {
      id: String(row.id),
      name: String(row.name || ''),
      cbo_code: (row.cbo_code as string | null) || null,
      department_id: (row.department_id as string | null) || null,
      department_name: relationName(row, 'departments'),
      status: String(row.status || 'active'),
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || ''),
    };
  }

  return {
    id: String(row.id),
    full_name: String(row.full_name || ''),
    email: String(row.email || ''),
    cpf: (row.cpf as string | null) || null,
    registration: (row.registration as string | null) || null,
    position: String(row.position || ''),
    department: (row.department as string | null) || null,
    phone: (row.phone as string | null) || null,
    admission_date: (row.admission_date as string | null) || null,
    branch_id: (row.branch_id as string | null) || null,
    branch_name: relationName(row, 'branches'),
    department_id: (row.department_id as string | null) || null,
    department_name: relationName(row, 'departments'),
    position_id: (row.position_id as string | null) || null,
    position_name: relationName(row, 'positions'),
    status: String(row.status || 'active'),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}

async function requireCompanyContext(requireWrite = false): Promise<CompanyContext> {
  const context = await requirePortalContext('company');

  if (requireWrite && !canWrite(context.membership)) {
    throw new AuthorizationError(
      'Somente administradores e RH da empresa podem alterar cadastros.'
    );
  }

  if (!context.membership.company_id || !context.membership.clinic_id) {
    throw new AuthorizationError('Membership da empresa incompleta.');
  }

  const { data: company, error } = await context.supabase
    .from('companies')
    .select('id, organization_id, clinic_id, name')
    .eq('id', context.membership.company_id)
    .single();

  if (error || !company) {
    throw new AuthorizationError('Empresa não encontrada para este usuário.');
  }

  return { ...context, company: company as CompanyScope };
}

async function assertBranch(context: CompanyContext, branchId: string | null | undefined) {
  if (!branchId) return null;
  const { data, error } = await context.supabase
    .from('branches')
    .select('id, name')
    .eq('id', branchId)
    .eq('company_id', context.company.id)
    .maybeSingle();

  if (error || !data) throw new ValidationError('Filial não encontrada nesta empresa.', 'branchId');
  return data as RelatedName;
}

async function assertDepartment(context: CompanyContext, departmentId: string | null | undefined) {
  if (!departmentId) return null;
  const { data, error } = await context.supabase
    .from('departments')
    .select('id, name')
    .eq('id', departmentId)
    .eq('company_id', context.company.id)
    .maybeSingle();

  if (error || !data) {
    throw new ValidationError('Departamento não encontrado nesta empresa.', 'departmentId');
  }

  return data as RelatedName;
}

async function assertPosition(context: CompanyContext, positionId: string | null | undefined) {
  if (!positionId) return null;
  const { data, error } = await context.supabase
    .from('positions')
    .select('id, name, cbo_code')
    .eq('id', positionId)
    .eq('company_id', context.company.id)
    .maybeSingle();

  if (error || !data)
    throw new ValidationError('Cargo não encontrado nesta empresa.', 'positionId');
  return data as RelatedName;
}

async function logChange(
  context: CompanyContext,
  eventType: string,
  entityType: string,
  entityId: string,
  title: string,
  changes: Record<string, unknown>
) {
  await Promise.allSettled([
    context.supabase.from('activity_events').insert({
      organization_id: context.company.organization_id,
      actor_id: context.user.id,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      title,
      description: context.company.name,
    }),
    context.supabase.from('audit_logs').insert({
      organization_id: context.company.organization_id,
      user_id: context.user.id,
      action: eventType,
      resource_type: entityType,
      resource_id: entityId,
      changes,
    }),
  ]);
}

async function getCreatedRecord(
  context: CompanyContext,
  resource: CompanyOrganizationResource,
  id: string
) {
  const { data, error } = await context.supabase
    .from(resource)
    .select(resourceSelect[resource])
    .eq('id', id)
    .eq('company_id', context.company.id)
    .single();

  if (error || !data) throw new NotFoundError('Registro organizacional');
  return mapRecord(resource, data as unknown as Row);
}

async function assertOwnedRecord(
  context: CompanyContext,
  resource: CompanyOrganizationResource,
  id: string
) {
  const { data, error } = await context.supabase
    .from(resource)
    .select('id')
    .eq('id', id)
    .eq('company_id', context.company.id)
    .maybeSingle();

  if (error || !data) throw new NotFoundError('Registro organizacional');
}

async function createRecord(
  context: CompanyContext,
  resource: CompanyOrganizationResource,
  body: unknown
) {
  if (resource === 'branches') {
    const input = branchRecordSchema.parse(body);
    const { data, error } = await context.supabase
      .from('branches')
      .insert({
        organization_id: context.company.organization_id,
        clinic_id: context.company.clinic_id,
        company_id: context.company.id,
        name: input.name,
        cnpj: nullable(input.cnpj),
        city: nullable(input.city),
        state: nullable(input.state)?.toUpperCase() || null,
        address: nullable(input.address),
        status: input.status,
        created_by: context.user.id,
      })
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Falha ao criar filial');
    await logChange(
      context,
      'branch.created',
      'branch',
      data.id,
      `Filial criada: ${input.name}`,
      input
    );
    return getCreatedRecord(context, resource, data.id);
  }

  if (resource === 'departments') {
    const input = departmentRecordSchema.parse(body);
    await assertBranch(context, input.branchId);
    const { data, error } = await context.supabase
      .from('departments')
      .insert({
        organization_id: context.company.organization_id,
        company_id: context.company.id,
        branch_id: input.branchId || null,
        name: input.name,
        status: input.status,
        created_by: context.user.id,
      })
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Falha ao criar departamento');
    await logChange(
      context,
      'department.created',
      'department',
      data.id,
      `Departamento criado: ${input.name}`,
      input
    );
    return getCreatedRecord(context, resource, data.id);
  }

  if (resource === 'positions') {
    const input = positionRecordSchema.parse(body);
    await assertDepartment(context, input.departmentId);
    const { data, error } = await context.supabase
      .from('positions')
      .insert({
        organization_id: context.company.organization_id,
        company_id: context.company.id,
        department_id: input.departmentId || null,
        name: input.name,
        cbo_code: nullable(input.cboCode),
        status: input.status,
        created_by: context.user.id,
      })
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Falha ao criar cargo');
    await logChange(
      context,
      'position.created',
      'position',
      data.id,
      `Cargo criado: ${input.name}`,
      input
    );
    return getCreatedRecord(context, resource, data.id);
  }

  const input = employeeRecordSchema.parse(body);
  const branch = await assertBranch(context, input.branchId);
  const department = await assertDepartment(context, input.departmentId);
  const position = await assertPosition(context, input.positionId);
  const resolvedDepartment = department?.name || input.department || null;
  const resolvedPosition = position?.name || input.position;

  const { data, error } = await context.supabase
    .from('employees')
    .insert({
      organization_id: context.company.organization_id,
      company_id: context.company.id,
      full_name: input.fullName,
      cpf: input.cpf,
      registration: input.registration,
      email: input.email,
      phone: nullable(input.phone),
      admission_date: input.admissionDate || null,
      branch_id: branch?.id || null,
      department_id: department?.id || null,
      position_id: position?.id || null,
      department: resolvedDepartment,
      position: resolvedPosition,
      status: input.status,
    })
    .select('id')
    .single();

  if (error || !data) throw error || new Error('Falha ao criar colaborador');
  await logChange(
    context,
    'employee.created',
    'employee',
    data.id,
    `Colaborador criado: ${input.fullName}`,
    input
  );
  return getCreatedRecord(context, resource, data.id);
}

async function updateRecord(
  context: CompanyContext,
  resource: CompanyOrganizationResource,
  body: unknown
) {
  const id = getBodyRecordId(body);
  await assertOwnedRecord(context, resource, id);

  if (resource === 'branches') {
    const input = branchRecordSchema.parse(body);
    const { error } = await context.supabase
      .from('branches')
      .update({
        name: input.name,
        cnpj: nullable(input.cnpj),
        city: nullable(input.city),
        state: nullable(input.state)?.toUpperCase() || null,
        address: nullable(input.address),
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', context.company.id);

    if (error) throw error;
    await logChange(
      context,
      'branch.updated',
      'branch',
      id,
      `Filial atualizada: ${input.name}`,
      input
    );
    return getCreatedRecord(context, resource, id);
  }

  if (resource === 'departments') {
    const input = departmentRecordSchema.parse(body);
    await assertBranch(context, input.branchId);
    const { error } = await context.supabase
      .from('departments')
      .update({
        name: input.name,
        branch_id: input.branchId || null,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', context.company.id);

    if (error) throw error;
    await logChange(
      context,
      'department.updated',
      'department',
      id,
      `Departamento atualizado: ${input.name}`,
      input
    );
    return getCreatedRecord(context, resource, id);
  }

  if (resource === 'positions') {
    const input = positionRecordSchema.parse(body);
    await assertDepartment(context, input.departmentId);
    const { error } = await context.supabase
      .from('positions')
      .update({
        name: input.name,
        department_id: input.departmentId || null,
        cbo_code: nullable(input.cboCode),
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', context.company.id);

    if (error) throw error;
    await logChange(
      context,
      'position.updated',
      'position',
      id,
      `Cargo atualizado: ${input.name}`,
      input
    );
    return getCreatedRecord(context, resource, id);
  }

  const input = employeeRecordSchema.parse(body);
  const branch = await assertBranch(context, input.branchId);
  const department = await assertDepartment(context, input.departmentId);
  const position = await assertPosition(context, input.positionId);
  const resolvedDepartment = department?.name || input.department || null;
  const resolvedPosition = position?.name || input.position;

  const { error } = await context.supabase
    .from('employees')
    .update({
      full_name: input.fullName,
      cpf: input.cpf,
      registration: input.registration,
      email: input.email,
      phone: nullable(input.phone),
      admission_date: input.admissionDate || null,
      branch_id: branch?.id || null,
      department_id: department?.id || null,
      position_id: position?.id || null,
      department: resolvedDepartment,
      position: resolvedPosition,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', context.company.id);

  if (error) throw error;
  await logChange(
    context,
    'employee.updated',
    'employee',
    id,
    `Colaborador atualizado: ${input.fullName}`,
    input
  );
  return getCreatedRecord(context, resource, id);
}

async function updateStatus(
  context: CompanyContext,
  resource: CompanyOrganizationResource,
  body: unknown
) {
  const id = getBodyRecordId(body);
  const input = statusUpdateSchema.parse(body);
  await assertOwnedRecord(context, resource, id);

  const { error } = await context.supabase
    .from(resource)
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', context.company.id);

  if (error) throw error;

  const entityType = entityTypes[resource];
  await logChange(
    context,
    `${entityType}.status_changed`,
    entityType,
    id,
    `Status alterado para ${input.status}`,
    input
  );
  return getCreatedRecord(context, resource, id);
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const resource = assertResource(params.resource);
    const context = await requireCompanyContext();
    const status = request.nextUrl.searchParams.get('status');

    let query = context.supabase
      .from(resource)
      .select(resourceSelect[resource])
      .eq('company_id', context.company.id);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const orderColumn = resource === 'employees' ? 'full_name' : 'name';
    const { data, error } = await query.order(orderColumn);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: ((data || []) as unknown as Row[]).map((row) => mapRecord(resource, row)),
    });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const resource = assertResource(params.resource);
    const context = await requireCompanyContext(true);
    const data = await createRecord(context, resource, await request.json());
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const resource = assertResource(params.resource);
    const context = await requireCompanyContext(true);
    const data = await updateRecord(context, resource, await request.json());
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const resource = assertResource(params.resource);
    const context = await requireCompanyContext(true);
    const data = await updateStatus(context, resource, await request.json());
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
