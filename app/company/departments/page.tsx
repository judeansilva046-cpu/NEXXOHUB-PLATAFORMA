import {
  OrganizationRecordsClient,
  type BranchRecord,
  type DepartmentRecord,
  type OrganizationHistoryEvent,
} from '../../../components/company/organization-records-client';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type DepartmentRow = Omit<DepartmentRecord, 'branch_name'> & {
  branches: SupabaseRelation<{ name: string }>;
};

function canManageCompanyOrganization(role: string) {
  return ['company_admin', 'company_hr'].includes(String(normalizeRole(role)));
}

export default async function CompanyDepartmentsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  if (!membership.company_id) throw new Error('Empresa não encontrada no contexto do portal.');

  const [{ data, error }, { data: branches }] = await Promise.all([
    supabase
      .from('departments')
      .select('id, name, branch_id, status, created_at, updated_at, branches(name)')
      .eq('company_id', membership.company_id)
      .order('name'),
    supabase
      .from('branches')
      .select('id, name, status')
      .eq('company_id', membership.company_id)
      .order('name'),
  ]);

  if (error) throw error;

  const records = ((data || []) as unknown as DepartmentRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    branch_id: row.branch_id,
    branch_name: firstRelation(row.branches)?.name || null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) satisfies DepartmentRecord[];

  const recordIds = records.map((record) => record.id);
  let history: OrganizationHistoryEvent[] = [];

  if (recordIds.length > 0) {
    const { data: events } = await supabase
      .from('activity_events')
      .select('id, event_type, entity_type, entity_id, title, description, occurred_at')
      .eq('entity_type', 'department')
      .in('entity_id', recordIds)
      .order('occurred_at', { ascending: false })
      .limit(20);

    history = (events || []) as OrganizationHistoryEvent[];
  }

  return (
    <OrganizationRecordsClient
      resource="departments"
      title="Departamentos"
      subtitle="CRUD real de departamentos, vinculados opcionalmente às filiais da empresa."
      initialRecords={records}
      references={{
        branches: (branches || []) as Pick<BranchRecord, 'id' | 'name' | 'status'>[],
        departments: records.map(({ id, name, branch_id, status }) => ({
          id,
          name,
          branch_id,
          status,
        })),
        positions: [],
      }}
      history={history}
      canManage={canManageCompanyOrganization(membership.role)}
    />
  );
}
