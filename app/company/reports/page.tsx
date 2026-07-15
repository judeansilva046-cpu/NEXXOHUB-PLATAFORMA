import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type ReportRow = {
  title: string;
  status: string;
  period_end: string | null;
  generated_at: string | null;
};

export default async function CompanyReportsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('nr1_dossiers')
    .select('title, status, period_end, generated_at')
    .eq('company_id', membership.company_id)
    .order('period_end', { ascending: false });

  if (error) throw error;
  const records = (data || []) as ReportRow[];

  return (
    <RecordsPage
      title="Relatorios"
      subtitle="Relatorios permitidos para acompanhamento de conformidade e gestao psicossocial."
      records={records}
      emptyMessage="Nenhum relatorio disponivel para esta empresa."
      columns={[
        { header: 'Relatorio', render: (row) => row.title },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Competencia', render: (row) => formatDate(row.period_end) },
        { header: 'Gerado em', render: (row) => formatDate(row.generated_at) },
      ]}
    />
  );
}
