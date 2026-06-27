import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type ProgramRow = {
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
};

export default async function ClinicProgramsPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  const { data, error } = await supabase
    .from('programs')
    .select('title, description, status, created_at, companies(name)')
    .eq('clinic_id', membership.clinic_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const records = (data || []) as unknown as ProgramRow[];

  return (
    <RecordsPage
      title="Programas psicossociais"
      subtitle="Programas criados pela clínica e persistidos no Supabase."
      records={records}
      emptyMessage="Nenhum programa criado ainda."
      columns={[
        { header: 'Programa', render: (row) => row.title },
        {
          header: 'Empresa',
          render: (row) => firstRelation(row.companies)?.name || 'Todas/sem vínculo',
        },
        { header: 'Descrição', render: (row) => row.description || '—' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Criado em', render: (row) => formatDate(row.created_at) },
      ]}
    />
  );
}
