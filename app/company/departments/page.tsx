import { RecordsPage, StatusBadge } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type DepartmentRow = {
  name: string;
  status: string;
  branches: SupabaseRelation<{ name: string }>;
};

export default async function CompanyDepartmentsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  const { data, error } = await supabase
    .from('departments')
    .select('name, status, branches(name)')
    .eq('company_id', membership.company_id)
    .order('name');

  if (error) throw error;
  const records = (data || []) as unknown as DepartmentRow[];

  return (
    <RecordsPage
      title="Departamentos"
      subtitle="Departamentos reais usados para segmentação da empresa."
      records={records}
      emptyMessage="Nenhum departamento cadastrado ainda."
      columns={[
        { header: 'Departamento', render: (row) => row.name },
        {
          header: 'Filial',
          render: (row) => firstRelation(row.branches)?.name || 'Todas/sem filial',
        },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  );
}
