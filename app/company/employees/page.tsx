import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type EmployeeRow = {
  full_name: string;
  email: string;
  position: string;
  department: string | null;
  status: string;
  created_at: string;
};

export default async function CompanyEmployeesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('employees')
    .select('full_name, email, position, department, status, created_at')
    .eq('company_id', membership.company_id)
    .order('full_name');

  if (error) throw error;
  const records = (data || []) as EmployeeRow[];

  return (
    <RecordsPage
      title="Colaboradores"
      subtitle="Colaboradores da sua empresa, isolados por tenant e empresa."
      records={records}
      emptyMessage="Nenhum colaborador cadastrado ainda."
      columns={[
        { header: 'Nome', render: (row) => row.full_name },
        { header: 'E-mail', render: (row) => row.email },
        { header: 'Cargo', render: (row) => row.position },
        { header: 'Departamento', render: (row) => row.department || '—' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criado em', render: (row) => formatDate(row.created_at) },
      ]}
    />
  );
}
