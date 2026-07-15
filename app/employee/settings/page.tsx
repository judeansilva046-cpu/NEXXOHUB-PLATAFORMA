import { RecordsPage } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type SettingRow = { label: string; value: string };

export default async function EmployeeSettingsPage() {
  const { membership } = await requirePortalContext('employee');
  const records: SettingRow[] = [
    { label: 'Portal', value: 'Colaborador' },
    { label: 'Organizacao', value: membership.organization_id },
    { label: 'Clinica', value: membership.clinic_id || '-' },
    { label: 'Empresa', value: membership.company_id || '-' },
    { label: 'Colaborador', value: membership.employee_id || '-' },
    { label: 'Perfil', value: membership.role },
  ];

  return (
    <RecordsPage
      title="Configuracoes"
      subtitle="Resumo do seu escopo de acesso."
      records={records}
      emptyMessage="Nenhuma configuracao disponivel."
      columns={[
        { header: 'Campo', render: (row) => row.label },
        { header: 'Valor', render: (row) => row.value },
      ]}
    />
  );
}
