import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type CompanyRow = {
  name: string;
  legal_name: string | null;
  cnpj: string;
  email: string | null;
  employee_count: number;
  status: string;
  created_at: string;
};

export default async function ClinicCompaniesPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  const { data, error } = await supabase
    .from('companies')
    .select('name, legal_name, cnpj, email, employee_count, status, created_at')
    .eq('clinic_id', membership.clinic_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as CompanyRow[];

  return (
    <RecordsPage
      title="Empresas clientes"
      subtitle="Empresas vinculadas à sua clínica, carregadas diretamente do Supabase."
      records={records}
      emptyMessage="Nenhuma empresa vinculada à clínica ainda."
      columns={[
        { header: 'Empresa', render: (row) => row.legal_name || row.name },
        { header: 'CNPJ', render: (row) => row.cnpj },
        { header: 'E-mail', render: (row) => row.email || '—' },
        { header: 'Colaboradores', render: (row) => row.employee_count },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criada em', render: (row) => formatDate(row.created_at) },
      ]}
    />
  );
}
