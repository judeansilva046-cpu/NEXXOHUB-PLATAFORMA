import { WeeklyCheckinForm } from '../../../components/portal/employee-actions';
import { RecordsPage, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type CheckinRow = {
  week_start: string;
  mood_score: number;
  stress_score: number;
  sleep_score: number | null;
  created_at: string;
};

export default async function EmployeeCheckinsPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('week_start, mood_score, stress_score, sleep_score, created_at')
    .eq('employee_id', membership.employee_id)
    .order('week_start', { ascending: false });

  if (error) throw error;
  const records = (data || []) as CheckinRow[];

  return (
    <RecordsPage
      title="Check-in semanal"
      subtitle="Suas respostas ficam protegidas e não aparecem individualmente para NexxoHub ou Clínica."
      records={records}
      emptyMessage="Você ainda não respondeu nenhum check-in."
      columns={[
        { header: 'Semana', render: (row) => formatDate(row.week_start) },
        { header: 'Bem-estar', render: (row) => row.mood_score },
        { header: 'Estresse', render: (row) => row.stress_score },
        { header: 'Sono', render: (row) => row.sleep_score || '—' },
        { header: 'Respondido em', render: (row) => formatDate(row.created_at) },
      ]}
    >
      <WeeklyCheckinForm />
    </RecordsPage>
  );
}
