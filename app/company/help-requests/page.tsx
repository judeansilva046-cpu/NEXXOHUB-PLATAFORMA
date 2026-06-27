import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type HelpRequestRow = {
  subject: string;
  description: string;
  status: string;
  created_at: string;
  employees: SupabaseRelation<{ full_name: string; email: string }>;
};

export default async function CompanyHelpRequestsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('help_requests')
    .select('subject, description, status, created_at, employees(full_name, email)')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as unknown as HelpRequestRow[];

  return (
    <RecordsPage
      title="Pedidos de ajuda"
      subtitle="Pedidos identificados enviados por colaboradores para tratativa do RH autorizado."
      records={records}
      emptyMessage="Nenhum pedido de ajuda aberto."
      columns={[
        {
          header: 'Colaborador',
          render: (row) => firstRelation(row.employees)?.full_name || '—',
        },
        { header: 'Assunto', render: (row) => row.subject },
        { header: 'Descrição', render: (row) => row.description },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criado em', render: (row) => formatDate(row.created_at) },
      ]}
    />
  );
}
