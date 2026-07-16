import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type CheckinRow = {
  mood_score: number | null;
  stress_score: number | null;
  week_start: string;
  created_at: string;
};

export default async function EmployeeActivityPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('mood_score, stress_score, week_start, created_at')
    .eq('employee_id', membership.employee_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as CheckinRow[];

  return (
    <RecordsPage
      title="Minha Atividade"
      subtitle="Historico dos seus check-ins e interacoes registradas."
      records={records}
      emptyMessage="Nenhuma atividade registrada ainda."
      columns={[
        { header: 'Humor', render: (row) => row.mood_score ?? '-' },
        { header: 'Estresse', render: (row) => row.stress_score ?? '-' },
        { header: 'Status', render: () => <StatusBadge status="registered" /> },
        { header: 'Semana', render: (row) => formatDate(row.week_start || row.created_at) },
      ]}
    />
  );
}
