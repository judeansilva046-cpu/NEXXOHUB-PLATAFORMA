import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type ProgramRow = {
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

export default async function EmployeeProgramsPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const { data, error } = await supabase
    .from('programs')
    .select('title, description, status, created_at')
    .eq('company_id', membership.company_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as ProgramRow[];

  return (
    <RecordsPage
      title="Programas disponíveis"
      subtitle="Programas liberados para sua empresa."
      records={records}
      emptyMessage="Nenhum programa ativo liberado para você ainda."
      columns={[
        { header: 'Programa', render: (row) => row.title },
        { header: 'Descrição', render: (row) => row.description || '—' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criado em', render: (row) => formatDate(row.created_at) },
      ]}
    />
  );
}
