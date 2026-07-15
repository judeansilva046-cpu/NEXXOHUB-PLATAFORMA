import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type CaseRow = {
  title: string;
  severity: string | null;
  status: string;
  opened_at: string | null;
  created_at: string;
};

export default async function CompanyDiagnosticsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('technical_cases')
    .select('title, severity, status, opened_at, created_at')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as CaseRow[];

  return (
    <RecordsPage
      title="Diagnosticos"
      subtitle="Casos tecnicos, achados e sinais psicossociais acompanhados pela clinica."
      records={records}
      emptyMessage="Nenhum diagnostico tecnico registrado para esta empresa."
      columns={[
        { header: 'Caso', render: (row) => row.title },
        { header: 'Severidade', render: (row) => row.severity || '-' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Aberto em', render: (row) => formatDate(row.opened_at || row.created_at) },
      ]}
    />
  );
}
