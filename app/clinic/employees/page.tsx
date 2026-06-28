import Link from 'next/link';
import {
  Award,
  Building2,
  FileWarning,
  HandHeart,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { DonutChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type CompanyRow = { id: string; name: string; status: string | null };
type EmployeeRow = {
  id: string;
  full_name: string;
  email: string | null;
  department: string | null;
  position: string | null;
  status: string;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
  departments: SupabaseRelation<{ name: string }>;
  positions: SupabaseRelation<{ name: string }>;
};

function employeeStatusLabel(status: string) {
  if (status === 'active') return 'Ativo';
  if (status === 'inactive') return 'Inativo/Afastado';
  if (status === 'archived') return 'Desligado';
  return status;
}

function employeeStatusTone(status: string): 'green' | 'orange' | 'slate' {
  if (status === 'active') return 'green';
  if (status === 'inactive') return 'orange';
  return 'slate';
}

export default async function ClinicEmployeesPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clínica não encontrada.');

  const { data: companyRows } = await supabase
    .from('companies')
    .select('id, name, status')
    .eq('clinic_id', membership.clinic_id)
    .is('deleted_at', null)
    .order('name');

  const companies = (companyRows || []) as CompanyRow[];
  const companyIds = companies.map((company) => company.id);

  const [
    { data: employees },
    { count: helpRequests },
    { count: complaints },
    { count: certificates },
  ] = await Promise.all([
    companyIds.length
      ? supabase
          .from('employees')
          .select(
            'id, full_name, email, department, position, status, created_at, companies(name), departments(name), positions(name)'
          )
          .in('company_id', companyIds)
          .order('full_name')
      : Promise.resolve({ data: [] }),
    supabase
      .from('help_requests')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', membership.clinic_id)
      .neq('status', 'closed'),
    supabase
      .from('complaints')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', membership.clinic_id)
      .neq('status', 'closed'),
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', membership.clinic_id),
  ]);

  const employeeRows = (employees || []) as unknown as EmployeeRow[];
  const active = employeeRows.filter((employee) => employee.status === 'active').length;
  const inactive = employeeRows.filter((employee) => employee.status === 'inactive').length;
  const archived = employeeRows.filter((employee) => employee.status === 'archived').length;
  const statusData: DonutItem[] = [
    { label: 'Ativos', value: active, color: '#12a36d' },
    { label: 'Inativos/Afastados', value: inactive, color: '#f5a308' },
    { label: 'Desligados', value: archived, color: '#ef4444' },
  ].filter((item) => item.value > 0);
  const companyData: DonutItem[] = companies
    .map((company, index) => ({
      label: company.name,
      value: employeeRows.filter(
        (employee) => firstRelation(employee.companies)?.name === company.name
      ).length,
      color: ['#2f76d2', '#12a36d', '#f5a308', '#8a5bd2', '#ef4444'][index % 5],
    }))
    .filter((item) => item.value > 0)
    .slice(0, 5);
  const quickActions: Array<[string, string, LucideIcon]> = [
    ['Diagnósticos', '/clinic/diagnostics', ShieldCheck],
    ['Pedidos de ajuda', '/clinic/help-requests', HandHeart],
    ['Denúncias', '/clinic/complaints', FileWarning],
    ['Certificados', '/clinic/certificates', Award],
    ['Empresas clientes', '/clinic/companies', Building2],
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Acompanhamento de Colaboradores"
        subtitle="Acompanhe tecnicamente colaboradores das empresas clientes, sem assumir o cadastro de RH da empresa."
        userName="Clínica"
        notifications={(helpRequests || 0) + (complaints || 0)}
      />

      <section className="rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-4 text-sm text-amber-950">
        A Clínica monitora evolução, participação, pedidos de ajuda, denúncias, certificados,
        indicadores e encaminhamentos. O cadastro e a atualização de colaboradores continuam sendo
        responsabilidade da Empresa.
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Colaboradores Monitorados"
          value={employeeRows.length}
          icon={Users}
          tone="blue"
        />
        <MetricCard label="Ativos" value={active} icon={UserCheck} tone="teal" />
        <MetricCard
          label="Pedidos de Ajuda Abertos"
          value={helpRequests || 0}
          icon={HandHeart}
          tone="orange"
        />
        <MetricCard
          label="Denúncias em Tratamento"
          value={complaints || 0}
          icon={FileWarning}
          tone="red"
        />
        <MetricCard
          label="Certificados Emitidos"
          value={certificates || 0}
          icon={Award}
          tone="purple"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <WorkspacePanel title="Colaboradores por Situação">
          {statusData.length ? (
            <DonutChart
              data={statusData}
              centerValue={employeeRows.length}
              centerLabel="Total"
              height={220}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhum colaborador vinculado às empresas clientes." />
          )}
        </WorkspacePanel>
        <WorkspacePanel title="Distribuição por Empresa">
          {companyData.length ? (
            <DonutChart
              data={companyData}
              centerValue={employeeRows.length}
              centerLabel="Monitorados"
              height={220}
            />
          ) : (
            <EmptyWorkspaceState message="Sem distribuição por empresa disponível." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
        <WorkspacePanel title="Monitoramento Técnico">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Colaborador</th>
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Departamento</th>
                  <th className="px-3 py-3">Cargo</th>
                  <th className="px-3 py-3">Situação</th>
                  <th className="px-3 py-3">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeRows.slice(0, 25).map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[#071737]">{employee.full_name}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {employee.email || 'Sem e-mail'}
                      </p>
                    </td>
                    <td className="px-3 py-3">{firstRelation(employee.companies)?.name || '—'}</td>
                    <td className="px-3 py-3">
                      {firstRelation(employee.departments)?.name || employee.department || '—'}
                    </td>
                    <td className="px-3 py-3">
                      {firstRelation(employee.positions)?.name || employee.position || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill
                        label={employeeStatusLabel(employee.status)}
                        tone={employeeStatusTone(employee.status)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      {new Date(employee.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!employeeRows.length && (
              <EmptyWorkspaceState message="Nenhum colaborador encontrado nas empresas atendidas." />
            )}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Ações Técnicas">
            <div className="space-y-2">
              {quickActions.map(([label, href, Icon]) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-blue-800 hover:bg-blue-50"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                  <span>›</span>
                </Link>
              ))}
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
