import { RecordsPage, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type CertificateRow = {
  issued_at: string;
  certificate_url: string | null;
  employees: SupabaseRelation<{ full_name: string; email: string }>;
  programs: SupabaseRelation<{ title: string }>;
};

export default async function CompanyCertificatesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('certificates')
    .select('issued_at, certificate_url, employees(full_name, email), programs(title)')
    .eq('company_id', membership.company_id)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as unknown as CertificateRow[];

  return (
    <RecordsPage
      title="Certificados"
      subtitle="Certificados emitidos para colaboradores da empresa."
      records={records}
      emptyMessage="Nenhum certificado emitido ainda."
      columns={[
        { header: 'Colaborador', render: (row) => firstRelation(row.employees)?.full_name || '—' },
        { header: 'Programa', render: (row) => firstRelation(row.programs)?.title || '—' },
        { header: 'Emitido em', render: (row) => formatDate(row.issued_at) },
        { header: 'Arquivo', render: (row) => row.certificate_url || '—' },
      ]}
    />
  );
}
