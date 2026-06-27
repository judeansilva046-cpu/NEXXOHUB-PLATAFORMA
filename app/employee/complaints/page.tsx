import { ComplaintForm } from '../../../components/portal/employee-actions';
import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type ComplaintRow = {
  category: string;
  description: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
};

export default async function EmployeeComplaintsPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const { data, error } = await supabase
    .from('complaints')
    .select('category, description, is_anonymous, status, created_at')
    .eq('employee_id', membership.employee_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as ComplaintRow[];

  return (
    <RecordsPage
      title="Canal de denúncia"
      subtitle="Denúncias identificadas aparecem aqui. Denúncias anônimas são registradas sem vínculo pessoal."
      records={records}
      emptyMessage="Nenhuma denúncia identificada registrada por você."
      columns={[
        { header: 'Categoria', render: (row) => row.category },
        { header: 'Descrição', render: (row) => row.description },
        { header: 'Tipo', render: (row) => (row.is_anonymous ? 'Anônima' : 'Identificada') },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criada em', render: (row) => formatDate(row.created_at) },
      ]}
    >
      <ComplaintForm />
    </RecordsPage>
  );
}
