import {
  OrganizationRecordsClient,
  type BranchRecord,
  type DepartmentRecord,
  type EmployeeRecord,
  type OrganizationHistoryEvent,
  type PositionRecord,
} from '../../../components/company/organization-records-client';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type EmployeeRow = Omit<EmployeeRecord, 'branch_name' | 'department_name' | 'position_name'> & {
  branches: SupabaseRelation<{ name: string }>;
  departments: SupabaseRelation<{ name: string }>;
  positions: SupabaseRelation<{ name: string }>;
};

function canManageCompanyOrganization(role: string) {
  return ['company_admin', 'company_hr'].includes(String(normalizeRole(role)));
}

export default async function CompanyEmployeesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  if (!membership.company_id) throw new Error('Empresa não encontrada no contexto do portal.');

  const [{ data, error }, { data: branches }, { data: departments }, { data: positions }] =
    await Promise.all([
      supabase
        .from('employees')
        .select(
          'id, full_name, email, cpf, registration, position, department, phone, admission_date, branch_id, department_id, position_id, status, created_at, updated_at, branches(name), departments(name), positions(name)'
        )
        .eq('company_id', membership.company_id)
        .order('full_name'),
      supabase
        .from('branches')
        .select('id, name, status')
        .eq('company_id', membership.company_id)
        .order('name'),
      supabase
        .from('departments')
        .select('id, name, branch_id, status')
        .eq('company_id', membership.company_id)
        .order('name'),
      supabase
        .from('positions')
        .select('id, name, department_id, status')
        .eq('company_id', membership.company_id)
        .order('name'),
    ]);

  if (error) throw error;

  const records = ((data || []) as unknown as EmployeeRow[]).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    cpf: row.cpf,
    registration: row.registration,
    position: row.position,
    department: row.department,
    phone: row.phone,
    admission_date: row.admission_date,
    branch_id: row.branch_id,
    branch_name: firstRelation(row.branches)?.name || null,
    department_id: row.department_id,
    department_name: firstRelation(row.departments)?.name || null,
    position_id: row.position_id,
    position_name: firstRelation(row.positions)?.name || null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) satisfies EmployeeRecord[];

  const recordIds = records.map((record) => record.id);
  let history: OrganizationHistoryEvent[] = [];

  if (recordIds.length > 0) {
    const { data: events } = await supabase
      .from('activity_events')
      .select('id, event_type, entity_type, entity_id, title, description, occurred_at')
      .eq('entity_type', 'employee')
      .in('entity_id', recordIds)
      .order('occurred_at', { ascending: false })
      .limit(20);

    history = (events || []) as OrganizationHistoryEvent[];
  }

  return (
    <OrganizationRecordsClient
      resource="employees"
      title="Colaboradores"
      subtitle="Cadastro individual, desligamento, reativação e histórico real dos colaboradores."
      initialRecords={records}
      references={{
        branches: (branches || []) as Pick<BranchRecord, 'id' | 'name' | 'status'>[],
        departments: (departments || []) as Pick<
          DepartmentRecord,
          'id' | 'name' | 'branch_id' | 'status'
        >[],
        positions: (positions || []) as Pick<
          PositionRecord,
          'id' | 'name' | 'department_id' | 'status'
        >[],
      }}
      history={history}
      canManage={canManageCompanyOrganization(membership.role)}
    />
  );
}
