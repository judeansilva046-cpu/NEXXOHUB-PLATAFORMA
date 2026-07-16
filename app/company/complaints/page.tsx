import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { StatusActionButtons } from '../../../components/portal/status-action-buttons';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type ComplaintRow = {
  id: string;
  category: string;
  description: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  employees: SupabaseRelation<{ full_name: string }>;
};

export default async function CompanyComplaintsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('complaints')
    .select('id, category, description, is_anonymous, status, created_at, employees(full_name)')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as unknown as ComplaintRow[];

  return (
    <RecordsPage
      title="Denuncias"
      subtitle="Canal de denuncia restrito a perfis autorizados de compliance/governanca."
      records={records}
      emptyMessage="Nenhuma denuncia registrada."
      columns={[
        {
          header: 'Origem',
          render: (row) =>
            row.is_anonymous ? 'Anonima' : firstRelation(row.employees)?.full_name || '-',
        },
        { header: 'Categoria', render: (row) => row.category },
        { header: 'Descricao', render: (row) => row.description },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criada em', render: (row) => formatDate(row.created_at) },
        {
          header: 'Acoes',
          render: (row) => (
            <StatusActionButtons
              url={`/api/company/complaints/${row.id}`}
              currentStatus={row.status}
              actions={[
                { label: 'Analisar', status: 'reviewing', tone: 'blue' },
                { label: 'Encerrar', status: 'closed', tone: 'green' },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
