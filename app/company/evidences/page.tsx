import { RecordsPage, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type EvidenceRow = {
  title: string;
  description: string | null;
  evidence_date: string | null;
  storage_path: string | null;
  created_at: string;
};

export default async function CompanyEvidencesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('evidences')
    .select('title, description, evidence_date, storage_path, created_at')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as EvidenceRow[];

  return (
    <RecordsPage
      title="Evidencias"
      subtitle="Evidencias registradas pela clinica para a sua empresa."
      records={records}
      emptyMessage="Nenhuma evidencia registrada para esta empresa."
      columns={[
        { header: 'Titulo', render: (row) => row.title },
        { header: 'Descricao', render: (row) => row.description || '-' },
        { header: 'Data', render: (row) => formatDate(row.evidence_date || row.created_at) },
        { header: 'Arquivo', render: (row) => row.storage_path || '-' },
      ]}
    />
  );
}
