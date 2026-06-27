import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  makeTemplateCsv,
  normalizeKey,
  parseImportFile,
  safeFilename,
  validateImportRows,
  type ImportIssue,
  type ReferenceData,
  type ValidatedImportRow,
} from './importer';
import { quickImportConfigs, quickImportTypes, type QuickImportType } from './config';
import { AuthorizationError, NotFoundError, ValidationError } from '../errors';
import type { PortalMembership } from '../portal-context';

const BUCKET = 'quick-onboarding-imports';
const MAX_ROWS_SYNC = 5000;
const PREVIEW_LIMIT = 50;

type UserLike = { id: string };

type ImportRecord = {
  id: string;
  organization_id: string;
  clinic_id: string;
  company_id: string | null;
  import_type: QuickImportType;
  original_filename: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  create_missing_structure: boolean;
};

export function assertQuickImportType(value: FormDataEntryValue | string | null): QuickImportType {
  if (typeof value === 'string' && quickImportTypes.includes(value as QuickImportType)) {
    return value as QuickImportType;
  }
  throw new ValidationError('Tipo de importação inválido.', 'type');
}

export function getTemplateResponse(importType: QuickImportType) {
  const csv = makeTemplateCsv(importType);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="template-${importType}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function listQuickOnboardingData(
  supabase: SupabaseClient,
  membership: PortalMembership
) {
  const [
    { data: companies },
    { data: imports },
    { count: connectionsCount },
    { count: syncLogsCount },
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, legal_name, cnpj, status')
      .eq('clinic_id', membership.clinic_id)
      .order('name'),
    supabase
      .from('quick_onboarding_imports')
      .select(
        'id, import_type, status, original_filename, total_rows, valid_rows, invalid_rows, created_count, updated_count, error_count, created_at, completed_at, companies(name)'
      )
      .eq('clinic_id', membership.clinic_id)
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('integration_connections')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', membership.clinic_id),
    supabase
      .from('integration_sync_logs')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', membership.clinic_id),
  ]);

  return {
    companies: companies || [],
    imports: imports || [],
    integrations: {
      connectionsCount: connectionsCount || 0,
      syncLogsCount: syncLogsCount || 0,
    },
  };
}

export async function createImportPreview({
  supabase,
  membership,
  user,
  formData,
}: {
  supabase: SupabaseClient;
  membership: PortalMembership;
  user: UserLike;
  formData: FormData;
}) {
  const importType = assertQuickImportType(formData.get('type'));
  const config = quickImportConfigs[importType];
  const file = formData.get('file');
  const companyIdValue = formData.get('companyId');
  const companyId = typeof companyIdValue === 'string' && companyIdValue ? companyIdValue : null;
  const createMissingStructure = formData.get('createMissingStructure') === 'true';

  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError('Envie um arquivo .csv, .xlsx ou .xls.', 'file');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new ValidationError('O arquivo excede o limite de 20MB.', 'file');
  }
  if (config.requiresCompany && !companyId) {
    throw new ValidationError('Selecione uma empresa cliente.', 'companyId');
  }

  await assertCompanyScope(supabase, membership, companyId);

  const parsedRows = await parseImportFile(file, importType);
  if (parsedRows.length > MAX_ROWS_SYNC) {
    throw new ValidationError(
      `Este upload possui ${parsedRows.length} linhas. Para processamento assíncrono, use até ${MAX_ROWS_SYNC} linhas nesta versão.`,
      'file'
    );
  }

  const reference = await loadReferenceData(supabase, membership, importType, companyId, {
    createMissingStructure,
  });
  const validation = validateImportRows(importType, parsedRows, reference);
  const storagePath = `${membership.organization_id}/${membership.clinic_id}/${importType}/${randomUUID()}-${safeFilename(
    file.name
  )}`;

  const uploadBuffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, uploadBuffer, {
      contentType: file.type || inferContentType(file.name),
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const previewRows = validation.rows.slice(0, PREVIEW_LIMIT).map((row) => ({
    rowNumber: row.rowNumber,
    values: row.normalized,
    errors: row.errors,
    warnings: row.warnings,
  }));

  const { data: importRecord, error: importError } = await supabase
    .from('quick_onboarding_imports')
    .insert({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: companyId,
      import_type: importType,
      status: 'previewed',
      original_filename: file.name,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      mime_type: file.type || inferContentType(file.name),
      size_bytes: file.size,
      total_rows: validation.summary.totalRows,
      valid_rows: validation.summary.validRows,
      invalid_rows: validation.summary.invalidRows,
      error_count: validation.summary.errorCount,
      create_missing_structure: createMissingStructure,
      options: { createMissingStructure },
      preview_rows: previewRows,
      summary: validation.summary,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (importError) throw importError;

  await replaceImportIssues(supabase, importRecord.id, validation.issues);
  await writeAuditTrail(supabase, membership, user, 'quick_onboarding.previewed', importRecord.id, {
    importType,
    fileName: file.name,
    summary: validation.summary,
  });

  return {
    importId: importRecord.id as string,
    canConfirm: validation.summary.errorCount === 0 && validation.summary.validRows > 0,
    previewRows,
    issues: validation.issues.slice(0, 200),
    summary: validation.summary,
  };
}

export async function confirmImport({
  supabase,
  membership,
  user,
  importId,
}: {
  supabase: SupabaseClient;
  membership: PortalMembership;
  user: UserLike;
  importId: string;
}) {
  const { data, error } = await supabase
    .from('quick_onboarding_imports')
    .select('*')
    .eq('id', importId)
    .eq('clinic_id', membership.clinic_id)
    .single();
  if (error || !data) throw new NotFoundError('Importação');

  const importRecord = data as ImportRecord;
  if (importRecord.organization_id !== membership.organization_id) throw new AuthorizationError();

  await supabase
    .from('quick_onboarding_imports')
    .update({ status: 'processing', confirmed_at: new Date().toISOString() })
    .eq('id', importId);

  const { data: blob, error: downloadError } = await supabase.storage
    .from(importRecord.storage_bucket || BUCKET)
    .download(importRecord.storage_path);
  if (downloadError || !blob) throw downloadError || new Error('Arquivo original não encontrado.');

  const file = new File([blob], importRecord.original_filename, {
    type: importRecord.mime_type || inferContentType(importRecord.original_filename),
  });
  const rows = await parseImportFile(file, importRecord.import_type);
  const reference = await loadReferenceData(
    supabase,
    membership,
    importRecord.import_type,
    importRecord.company_id,
    { createMissingStructure: importRecord.create_missing_structure }
  );
  const validation = validateImportRows(importRecord.import_type, rows, reference);

  if (validation.summary.errorCount > 0) {
    await replaceImportIssues(supabase, importId, validation.issues);
    await supabase
      .from('quick_onboarding_imports')
      .update({
        status: 'failed',
        total_rows: validation.summary.totalRows,
        valid_rows: validation.summary.validRows,
        invalid_rows: validation.summary.invalidRows,
        error_count: validation.summary.errorCount,
        summary: validation.summary,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importId);
    throw new ValidationError(
      'A importação ainda possui erros. Corrija o arquivo e gere uma nova prévia.'
    );
  }

  const createdCount = await persistRows(
    supabase,
    membership,
    user,
    importRecord.import_type,
    importRecord.company_id,
    validation.rows
  );
  const status = validation.summary.warningCount > 0 ? 'completed_with_errors' : 'completed';

  await supabase
    .from('quick_onboarding_imports')
    .update({
      status,
      total_rows: validation.summary.totalRows,
      valid_rows: validation.summary.validRows,
      invalid_rows: validation.summary.invalidRows,
      created_count: createdCount,
      updated_count: 0,
      error_count: validation.summary.errorCount,
      summary: validation.summary,
      completed_at: new Date().toISOString(),
    })
    .eq('id', importId);

  await writeAuditTrail(supabase, membership, user, 'quick_onboarding.confirmed', importId, {
    importType: importRecord.import_type,
    createdCount,
    summary: validation.summary,
  });

  return {
    importId,
    status,
    createdCount,
    updatedCount: 0,
    summary: validation.summary,
  };
}

async function assertCompanyScope(
  supabase: SupabaseClient,
  membership: PortalMembership,
  companyId: string | null
) {
  if (!companyId) return;
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('clinic_id', membership.clinic_id)
    .eq('organization_id', membership.organization_id)
    .maybeSingle();
  if (error || !data) throw new AuthorizationError('Empresa fora do escopo da clínica.');
}

async function loadReferenceData(
  supabase: SupabaseClient,
  membership: PortalMembership,
  importType: QuickImportType,
  companyId: string | null,
  options: { createMissingStructure: boolean }
): Promise<ReferenceData> {
  if (importType === 'companies') {
    const { data } = await supabase
      .from('companies')
      .select('cnpj')
      .eq('clinic_id', membership.clinic_id);
    return {
      existingCompanyCnpjs: new Set(
        (data || []).map((item: { cnpj: string }) => digits(item.cnpj))
      ),
    };
  }

  if (!companyId) throw new ValidationError('Empresa obrigatória.', 'companyId');

  const [branches, departments, positions, employees] = await Promise.all([
    supabase.from('branches').select('id, name').eq('company_id', companyId),
    supabase
      .from('departments')
      .select('id, name, branch_id, branches(name)')
      .eq('company_id', companyId),
    supabase.from('positions').select('id, name').eq('company_id', companyId),
    supabase
      .from('employees')
      .select('email, cpf')
      .eq('organization_id', membership.organization_id),
  ]);

  const departmentMap = new Map<string, { id: string; name: string; branchName?: string | null }>();
  for (const department of departments.data || []) {
    departmentMap.set(normalizeKey(department.name), {
      id: department.id,
      name: department.name,
      branchName: firstRelationName(department.branches),
    });
  }

  return {
    existingBranchNames: new Set(
      (branches.data || []).map((item: { name: string }) => normalizeKey(item.name))
    ),
    existingDepartments: departmentMap,
    existingPositionNames: new Set(
      (positions.data || []).map((item: { name: string }) => normalizeKey(item.name))
    ),
    existingEmployeeEmails: new Set(
      (employees.data || [])
        .map((item: { email: string | null }) => item.email?.toLowerCase())
        .filter(Boolean) as string[]
    ),
    existingEmployeeCpfs: new Set(
      (employees.data || []).map((item: { cpf: string | null }) => digits(item.cpf)).filter(Boolean)
    ),
    createMissingStructure: options.createMissingStructure,
  };
}

async function persistRows(
  supabase: SupabaseClient,
  membership: PortalMembership,
  user: UserLike,
  importType: QuickImportType,
  companyId: string | null,
  rows: ValidatedImportRow[]
) {
  const cleanRows = rows.filter((row) => row.errors.length === 0);

  if (importType === 'companies') {
    const payload = cleanRows.map((row) => ({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      legal_name: row.normalized.legal_name,
      name: row.normalized.name,
      cnpj: row.normalized.cnpj,
      responsible_name: row.normalized.responsible_name,
      hr_responsible: row.normalized.responsible_name,
      email: row.normalized.email,
      phone: row.normalized.phone,
      segment: row.normalized.segment,
      city: row.normalized.city,
      state: row.normalized.state,
      zip_code: row.normalized.zip_code,
      address: row.normalized.address,
      address_number: row.normalized.address_number,
      employee_count: row.normalized.employee_count,
      status: row.normalized.status,
    }));
    await insertInChunks(supabase, 'companies', payload);
    return payload.length;
  }

  if (!companyId) throw new ValidationError('Empresa obrigatória.', 'companyId');

  if (importType === 'branches') {
    const payload = cleanRows.map((row) => ({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: companyId,
      name: row.normalized.name,
      cnpj: row.normalized.cnpj,
      city: row.normalized.city,
      state: row.normalized.state,
      address: row.normalized.address,
      responsible_name: row.normalized.responsible_name,
      phone: row.normalized.phone,
      email: row.normalized.email,
      status: row.normalized.status,
      created_by: user.id,
    }));
    await insertInChunks(supabase, 'branches', payload);
    return payload.length;
  }

  if (importType === 'departments') {
    const branchMap = await loadBranchMap(supabase, companyId);
    const payload = cleanRows.map((row) => ({
      organization_id: membership.organization_id,
      company_id: companyId,
      branch_id: row.normalized.branch_name
        ? branchMap.get(normalizeKey(String(row.normalized.branch_name))) || null
        : null,
      name: row.normalized.name,
      responsible_name: row.normalized.responsible_name,
      status: row.normalized.status,
      created_by: user.id,
    }));
    await insertInChunks(supabase, 'departments', payload);
    return payload.length;
  }

  if (importType === 'positions') {
    const departmentMap = await loadDepartmentMap(supabase, companyId);
    const payload = cleanRows.map((row) => ({
      organization_id: membership.organization_id,
      company_id: companyId,
      department_id: row.normalized.department_name
        ? departmentMap.get(normalizeKey(String(row.normalized.department_name))) || null
        : null,
      name: row.normalized.name,
      cbo_code: row.normalized.cbo_code,
      description: row.normalized.description,
      status: row.normalized.status,
      created_by: user.id,
    }));
    await insertInChunks(supabase, 'positions', payload);
    return payload.length;
  }

  return persistEmployees(supabase, membership, user, companyId, cleanRows);
}

async function persistEmployees(
  supabase: SupabaseClient,
  membership: PortalMembership,
  user: UserLike,
  companyId: string,
  rows: ValidatedImportRow[]
) {
  const branchMap = await loadBranchMap(supabase, companyId);
  const departmentMap = await loadDepartmentMap(supabase, companyId);
  const positionMap = await loadPositionMap(supabase, companyId);

  for (const row of rows) {
    const branchName = String(row.normalized.branch_name || '');
    const departmentName = String(row.normalized.department_name || '');
    const positionName = String(row.normalized.position_name || '');

    if (branchName && !branchMap.has(normalizeKey(branchName))) {
      const { data, error } = await supabase
        .from('branches')
        .insert({
          organization_id: membership.organization_id,
          clinic_id: membership.clinic_id,
          company_id: companyId,
          name: branchName,
          city: row.normalized.city,
          state: row.normalized.state,
          status: 'active',
          created_by: user.id,
        })
        .select('id, name')
        .single();
      if (error) throw error;
      branchMap.set(normalizeKey(data.name), data.id);
    }

    if (departmentName && !departmentMap.has(normalizeKey(departmentName))) {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          organization_id: membership.organization_id,
          company_id: companyId,
          branch_id: branchName ? branchMap.get(normalizeKey(branchName)) || null : null,
          name: departmentName,
          status: 'active',
          created_by: user.id,
        })
        .select('id, name')
        .single();
      if (error) throw error;
      departmentMap.set(normalizeKey(data.name), data.id);
    }

    if (positionName && !positionMap.has(normalizeKey(positionName))) {
      const { data, error } = await supabase
        .from('positions')
        .insert({
          organization_id: membership.organization_id,
          company_id: companyId,
          department_id: departmentName
            ? departmentMap.get(normalizeKey(departmentName)) || null
            : null,
          name: positionName,
          status: 'active',
          created_by: user.id,
        })
        .select('id, name')
        .single();
      if (error) throw error;
      positionMap.set(normalizeKey(data.name), data.id);
    }
  }

  const payload = rows.map((row) => ({
    organization_id: membership.organization_id,
    company_id: companyId,
    full_name: row.normalized.full_name,
    cpf: row.normalized.cpf,
    email: row.normalized.email,
    phone: row.normalized.phone,
    birth_date: row.normalized.birth_date,
    gender: row.normalized.gender,
    branch_id: row.normalized.branch_name
      ? branchMap.get(normalizeKey(String(row.normalized.branch_name))) || null
      : null,
    department_id: row.normalized.department_name
      ? departmentMap.get(normalizeKey(String(row.normalized.department_name))) || null
      : null,
    position_id: row.normalized.position_name
      ? positionMap.get(normalizeKey(String(row.normalized.position_name))) || null
      : null,
    position: row.normalized.position_name,
    department: row.normalized.department_name,
    city: row.normalized.city,
    state: row.normalized.state,
    admission_date: row.normalized.admission_date,
    status: row.normalized.status,
  }));
  await insertInChunks(supabase, 'employees', payload);

  const { count } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);
  if (typeof count === 'number') {
    await supabase.from('companies').update({ employee_count: count }).eq('id', companyId);
  }

  return payload.length;
}

async function insertInChunks(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[]
) {
  for (let index = 0; index < rows.length; index += 500) {
    const chunk = rows.slice(index, index + 500);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}

async function replaceImportIssues(
  supabase: SupabaseClient,
  importId: string,
  issues: ImportIssue[]
) {
  await supabase.from('quick_onboarding_import_errors').delete().eq('import_id', importId);
  if (!issues.length) return;
  const payload = issues.map((item) => ({
    import_id: importId,
    row_number: item.rowNumber,
    field: item.field,
    code: item.code,
    message: item.message,
    severity: item.severity,
    row_data: item.rowData || {},
  }));
  await insertInChunks(supabase, 'quick_onboarding_import_errors', payload);
}

async function writeAuditTrail(
  supabase: SupabaseClient,
  membership: PortalMembership,
  user: UserLike,
  action: string,
  importId: string,
  changes: Record<string, unknown>
) {
  await Promise.all([
    supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: action,
      entity_type: 'quick_onboarding_import',
      entity_id: importId,
      title: action.endsWith('confirmed')
        ? 'Importação rápida confirmada'
        : 'Prévia de importação gerada',
      description: JSON.stringify(changes.summary || {}),
    }),
    supabase.from('audit_logs').insert({
      organization_id: membership.organization_id,
      user_id: user.id,
      action,
      resource_type: 'quick_onboarding_import',
      resource_id: importId,
      changes,
    }),
  ]);
}

async function loadBranchMap(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .eq('company_id', companyId);
  if (error) throw error;
  return new Map(
    (data || []).map((item: { id: string; name: string }) => [normalizeKey(item.name), item.id])
  );
}

async function loadDepartmentMap(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .eq('company_id', companyId);
  if (error) throw error;
  return new Map(
    (data || []).map((item: { id: string; name: string }) => [normalizeKey(item.name), item.id])
  );
}

async function loadPositionMap(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('positions')
    .select('id, name')
    .eq('company_id', companyId);
  if (error) throw error;
  return new Map(
    (data || []).map((item: { id: string; name: string }) => [normalizeKey(item.name), item.id])
  );
}

function inferContentType(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  return 'application/octet-stream';
}

function digits(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

function firstRelationName(value: unknown) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name || null;
  if (typeof value === 'object' && 'name' in value) return String(value.name);
  return null;
}
