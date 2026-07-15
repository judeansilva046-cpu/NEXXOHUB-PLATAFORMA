import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type ReportRow = {
  title: string;
  status: string;
  period_end: string | null;
  generated_at: string | null;
  companies: { name?: string } | null;
};

export default async function ClinicReportsPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  const { data, error } = await supabase
    .from('nr1_dossiers')
    .select('title, status, period_end, generated_at, companies(name)')
    .eq('clinic_id', membership.clinic_id)
    .order('period_end', { ascending: false });

  if (error) throw error;
  const records = (data || []) as unknown as ReportRow[];

  return (
    <RecordsPage
      title="Relatorios"
      subtitle="Relatorios e dossies gerados para as empresas atendidas."
      records={records}
      emptyMessage="Nenhum relatorio gerado pela clinica."
      columns={[
        { header: 'Relatorio', render: (row) => row.title },
        { header: 'Empresa', render: (row) => row.companies?.name || '-' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Competencia', render: (row) => formatDate(row.period_end) },
        { header: 'Gerado em', render: (row) => formatDate(row.generated_at) },
      ]}
    />
  );
}
