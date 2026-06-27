import { HelpRequestForm } from '../../../components/portal/employee-actions';
import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type HelpRequestRow = {
  subject: string;
  description: string;
  status: string;
  created_at: string;
  closed_at: string | null;
};

export default async function EmployeeHelpRequestsPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const { data, error } = await supabase
    .from('help_requests')
    .select('subject, description, status, created_at, closed_at')
    .eq('employee_id', membership.employee_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as HelpRequestRow[];

  return (
    <RecordsPage
      title="Pedidos de ajuda"
      subtitle="Pedidos identificados enviados ao RH da sua empresa."
      records={records}
      emptyMessage="Nenhum pedido de ajuda registrado."
      columns={[
        { header: 'Assunto', render: (row) => row.subject },
        { header: 'Descrição', render: (row) => row.description },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criado em', render: (row) => formatDate(row.created_at) },
        { header: 'Encerrado em', render: (row) => formatDate(row.closed_at) },
      ]}
    >
      <HelpRequestForm />
    </RecordsPage>
  );
}
