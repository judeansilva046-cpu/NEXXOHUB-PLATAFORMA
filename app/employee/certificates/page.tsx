import { RecordsPage, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type CertificateRow = {
  issued_at: string;
  certificate_url: string | null;
  programs: SupabaseRelation<{ title: string }>;
};

export default async function EmployeeCertificatesPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const { data, error } = await supabase
    .from('certificates')
    .select('issued_at, certificate_url, programs(title)')
    .eq('employee_id', membership.employee_id)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as unknown as CertificateRow[];

  return (
    <RecordsPage
      title="Meus certificados"
      subtitle="Certificados emitidos para sua jornada."
      records={records}
      emptyMessage="Nenhum certificado emitido ainda."
      columns={[
        { header: 'Programa', render: (row) => firstRelation(row.programs)?.title || '—' },
        { header: 'Emitido em', render: (row) => formatDate(row.issued_at) },
        { header: 'Arquivo', render: (row) => row.certificate_url || '—' },
      ]}
    />
  );
}
