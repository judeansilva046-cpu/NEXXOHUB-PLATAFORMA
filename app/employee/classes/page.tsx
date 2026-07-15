import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type LessonRow = {
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

export default async function EmployeeClassesPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const { data, error } = await supabase
    .from('lessons')
    .select('title, description, status, created_at')
    .eq('company_id', membership.company_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as LessonRow[];

  return (
    <RecordsPage
      title="Aulas e Modulos"
      subtitle="Conteudos liberados para voce pela clinica e pela empresa."
      records={records}
      emptyMessage="Nenhuma aula liberada para voce ainda."
      columns={[
        { header: 'Aula', render: (row) => row.title },
        { header: 'Descricao', render: (row) => row.description || '-' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Publicado em', render: (row) => formatDate(row.created_at) },
      ]}
    />
  );
}
