import {
  OrganizationRecordsClient,
  type BranchRecord,
  type DepartmentRecord,
  type OrganizationHistoryEvent,
  type PositionRecord,
} from '../../../components/company/organization-records-client';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type PositionRow = Omit<PositionRecord, 'department_name'> & {
  departments: SupabaseRelation<{ name: string }>;
};

function canManageCompanyOrganization(role: string) {
  return ['company_admin', 'company_hr'].includes(String(normalizeRole(role)));
}

export default async function CompanyPositionsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  if (!membership.company_id) throw new Error('Empresa não encontrada no contexto do portal.');

  const [{ data, error }, { data: branches }, { data: departments }] = await Promise.all([
    supabase
      .from('positions')
      .select(
        'id, name, cbo_code, department_id, status, created_at, updated_at, departments(name)'
      )
      .eq('company_id', membership.company_id)
      .order('name'),
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
  ]);

  if (error) throw error;

  const records = ((data || []) as unknown as PositionRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    cbo_code: row.cbo_code,
    department_id: row.department_id,
    department_name: firstRelation(row.departments)?.name || null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) satisfies PositionRecord[];

  const recordIds = records.map((record) => record.id);
  let history: OrganizationHistoryEvent[] = [];

  if (recordIds.length > 0) {
    const { data: events } = await supabase
      .from('activity_events')
      .select('id, event_type, entity_type, entity_id, title, description, occurred_at')
      .eq('entity_type', 'position')
      .in('entity_id', recordIds)
      .order('occurred_at', { ascending: false })
      .limit(20);

    history = (events || []) as OrganizationHistoryEvent[];
  }

  return (
    <OrganizationRecordsClient
      resource="positions"
      title="Cargos"
      subtitle="CRUD real de cargos, com CBO, vínculo opcional a departamentos e auditoria."
      initialRecords={records}
      references={{
        branches: (branches || []) as Pick<BranchRecord, 'id' | 'name' | 'status'>[],
        departments: (departments || []) as Pick<
          DepartmentRecord,
          'id' | 'name' | 'branch_id' | 'status'
        >[],
        positions: records.map(({ id, name, department_id, status }) => ({
          id,
          name,
          department_id,
          status,
        })),
      }}
      history={history}
      canManage={canManageCompanyOrganization(membership.role)}
    />
  );
}
