import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type DossierRow = {
  title: string;
  period_start: string;
  period_end: string;
  status: string;
  storage_path: string | null;
  generated_at: string | null;
};

export default async function CompanyNr1DossierPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('nr1_dossiers')
    .select('title, period_start, period_end, status, storage_path, generated_at')
    .eq('company_id', membership.company_id)
    .order('period_end', { ascending: false });

  if (error) throw error;
  const records = (data || []) as DossierRow[];

  return (
    <RecordsPage
      title="Dossie NR-1"
      subtitle="Dossies gerados pela clinica para evidencia de conformidade."
      records={records}
      emptyMessage="Nenhum dossie NR-1 gerado para esta empresa."
      columns={[
        { header: 'Titulo', render: (row) => row.title },
        { header: 'Periodo', render: (row) => `${formatDate(row.period_start)} - ${formatDate(row.period_end)}` },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Arquivo', render: (row) => row.storage_path || '-' },
        { header: 'Gerado em', render: (row) => formatDate(row.generated_at) },
      ]}
    />
  );
}
