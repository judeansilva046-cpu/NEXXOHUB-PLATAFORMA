import {
  OrganizationRecordsClient,
  type BranchRecord,
  type OrganizationHistoryEvent,
} from '../../../components/company/organization-records-client';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';

function canManageCompanyOrganization(role: string) {
  return ['company_admin', 'company_hr'].includes(String(normalizeRole(role)));
}

export default async function CompanyBranchesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  if (!membership.company_id) throw new Error('Empresa não encontrada no contexto do portal.');

  const { data, error } = await supabase
    .from('branches')
    .select('id, name, cnpj, city, state, address, status, created_at, updated_at')
    .eq('company_id', membership.company_id)
    .order('name');

  if (error) throw error;

  const records = (data || []) as BranchRecord[];
  const recordIds = records.map((record) => record.id);
  let history: OrganizationHistoryEvent[] = [];

  if (recordIds.length > 0) {
    const { data: events } = await supabase
      .from('activity_events')
      .select('id, event_type, entity_type, entity_id, title, description, occurred_at')
      .eq('entity_type', 'branch')
      .in('entity_id', recordIds)
      .order('occurred_at', { ascending: false })
      .limit(20);

    history = (events || []) as OrganizationHistoryEvent[];
  }

  return (
    <OrganizationRecordsClient
      resource="branches"
      title="Filiais"
      subtitle="CRUD real de filiais da empresa, com status, importação em lote e auditoria."
      initialRecords={records}
      references={{
        branches: records.map(({ id, name, status }) => ({ id, name, status })),
        departments: [],
        positions: [],
      }}
      history={history}
      canManage={canManageCompanyOrganization(membership.role)}
    />
  );
}
