import { IssueCertificateButton } from '../../../components/portal/employee-actions';
import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type ProgramRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

type CertificateRow = {
  program_id: string | null;
};

type ProgramRecord = ProgramRow & {
  certificateIssued: boolean;
};

export default async function EmployeeProgramsPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const [{ data: programs, error }, { data: certificates }] = await Promise.all([
    supabase
      .from('programs')
      .select('id, title, description, status, created_at')
      .eq('company_id', membership.company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('certificates')
      .select('program_id')
      .eq('employee_id', membership.employee_id),
  ]);

  if (error) throw error;

  const issuedProgramIds = new Set(
    ((certificates || []) as CertificateRow[]).map((item) => item.program_id).filter(Boolean)
  );
  const records: ProgramRecord[] = ((programs || []) as ProgramRow[]).map((program) => ({
    ...program,
    certificateIssued: issuedProgramIds.has(program.id),
  }));

  return (
    <RecordsPage
      title="Programas disponiveis"
      subtitle="Programas liberados para sua empresa."
      records={records}
      emptyMessage="Nenhum programa ativo liberado para voce ainda."
      columns={[
        { header: 'Programa', render: (row) => row.title },
        { header: 'Descricao', render: (row) => row.description || '-' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criado em', render: (row) => formatDate(row.created_at) },
        {
          header: 'Certificado',
          render: (row) => (
            <IssueCertificateButton programId={row.id} alreadyIssued={row.certificateIssued} />
          ),
        },
      ]}
    />
  );
}
