import { RecordsPage, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type EvidenceRow = {
  title: string;
  description: string | null;
  evidence_date: string | null;
  storage_path: string | null;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
};

export default async function ClinicEvidencesPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('clinic_id', membership.clinic_id);
  const companyIds = (companies || []).map((company) => company.id);

  const { data, error } = companyIds.length
    ? await supabase
        .from('evidences')
        .select('title, description, evidence_date, storage_path, created_at, companies(name)')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null };

  if (error) throw error;
  const records = (data || []) as unknown as EvidenceRow[];

  return (
    <RecordsPage
      title="Evidências"
      subtitle="Evidências vinculadas às empresas atendidas pela clínica."
      records={records}
      emptyMessage="Nenhuma evidência registrada ainda."
      columns={[
        { header: 'Evidência', render: (row) => row.title },
        { header: 'Empresa', render: (row) => firstRelation(row.companies)?.name || '—' },
        { header: 'Data', render: (row) => formatDate(row.evidence_date || row.created_at) },
        { header: 'Arquivo', render: (row) => row.storage_path || '—' },
        { header: 'Descrição', render: (row) => row.description || '—' },
      ]}
    />
  );
}
