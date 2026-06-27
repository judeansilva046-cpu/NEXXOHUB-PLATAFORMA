import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type DossierRow = {
  title: string;
  period_start: string;
  period_end: string;
  status: string;
  generated_at: string | null;
  companies: SupabaseRelation<{ name: string }>;
};

export default async function ClinicNr1DossiersPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  const { data, error } = await supabase
    .from('nr1_dossiers')
    .select('title, period_start, period_end, status, generated_at, companies(name)')
    .eq('clinic_id', membership.clinic_id)
    .order('period_end', { ascending: false });

  if (error) throw error;
  const records = (data || []) as unknown as DossierRow[];

  return (
    <RecordsPage
      title="Dossiês NR-1"
      subtitle="Dossiês gerados para as empresas vinculadas à clínica."
      records={records}
      emptyMessage="Nenhum dossiê NR-1 gerado ainda."
      columns={[
        { header: 'Dossiê', render: (row) => row.title },
        { header: 'Empresa', render: (row) => firstRelation(row.companies)?.name || '—' },
        {
          header: 'Período',
          render: (row) => `${formatDate(row.period_start)} a ${formatDate(row.period_end)}`,
        },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Gerado em', render: (row) => formatDate(row.generated_at) },
      ]}
    />
  );
}
