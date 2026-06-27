import { RecordsPage, StatusBadge } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type PositionRow = {
  name: string;
  cbo_code: string | null;
  status: string;
};

export default async function CompanyPositionsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('positions')
    .select('name, cbo_code, status')
    .eq('company_id', membership.company_id)
    .order('name');

  if (error) throw error;
  const records = (data || []) as PositionRow[];

  return (
    <RecordsPage
      title="Cargos"
      subtitle="Cargos vinculados à empresa para segmentação psicossocial."
      records={records}
      emptyMessage="Nenhum cargo cadastrado ainda."
      columns={[
        { header: 'Cargo', render: (row) => row.name },
        { header: 'CBO', render: (row) => row.cbo_code || '—' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  );
}
