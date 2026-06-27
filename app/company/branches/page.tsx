import { RecordsPage, StatusBadge } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type BranchRow = {
  name: string;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  status: string;
};

export default async function CompanyBranchesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('branches')
    .select('name, cnpj, city, state, status')
    .eq('company_id', membership.company_id)
    .order('name');

  if (error) throw error;
  const records = (data || []) as BranchRow[];

  return (
    <RecordsPage
      title="Filiais"
      subtitle="Filiais cadastradas para segmentação de indicadores e evidências."
      records={records}
      emptyMessage="Nenhuma filial cadastrada ainda."
      columns={[
        { header: 'Filial', render: (row) => row.name },
        { header: 'CNPJ', render: (row) => row.cnpj || '—' },
        { header: 'Cidade', render: (row) => row.city || '—' },
        { header: 'UF', render: (row) => row.state || '—' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  );
}
