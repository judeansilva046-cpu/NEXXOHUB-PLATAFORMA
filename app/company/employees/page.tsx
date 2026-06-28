import { Clock3, UserCheck, UserMinus, UserPlus, Users } from 'lucide-react';
import {
  OrganizationRecordsClient,
  type BranchRecord,
  type DepartmentRecord,
  type EmployeeRecord,
  type OrganizationHistoryEvent,
  type PositionRecord,
} from '../../../components/company/organization-records-client';
import { DonutChart, TrendChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import { EmptyWorkspaceState, WorkspacePanel } from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type EmployeeRow = Omit<EmployeeRecord, 'branch_name' | 'department_name' | 'position_name'> & {
  branches: SupabaseRelation<{ name: string }>;
  departments: SupabaseRelation<{ name: string }>;
  positions: SupabaseRelation<{ name: string }>;
};

function canManageCompanyOrganization(role: string) {
  return ['company_admin', 'company_hr'].includes(String(normalizeRole(role)));
}

export default async function CompanyEmployeesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  if (!membership.company_id) throw new Error('Empresa não encontrada no contexto do portal.');

  const [{ data, error }, { data: branches }, { data: departments }, { data: positions }] =
    await Promise.all([
      supabase
        .from('employees')
        .select(
          'id, full_name, email, cpf, registration, position, department, phone, admission_date, branch_id, department_id, position_id, status, created_at, updated_at, branches(name), departments(name), positions(name)'
        )
        .eq('company_id', membership.company_id)
        .order('full_name'),
      supabase
        .from('branches')
        .select('id, name, status')
        .eq('company_id', membership.company_id)
        .order('name'),
      supabase
        .from('departments')
        .select('id, name, branch_id, status')
        .eq('company_id', membership.company_id)
        .order('name'),
      supabase
        .from('positions')
        .select('id, name, department_id, status')
        .eq('company_id', membership.company_id)
        .order('name'),
    ]);

  if (error) throw error;

  const records = ((data || []) as unknown as EmployeeRow[]).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    cpf: row.cpf,
    registration: row.registration,
    position: row.position,
    department: row.department,
    phone: row.phone,
    admission_date: row.admission_date,
    branch_id: row.branch_id,
    branch_name: firstRelation(row.branches)?.name || null,
    department_id: row.department_id,
    department_name: firstRelation(row.departments)?.name || null,
    position_id: row.position_id,
    position_name: firstRelation(row.positions)?.name || null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) satisfies EmployeeRecord[];

  const recordIds = records.map((record) => record.id);
  let history: OrganizationHistoryEvent[] = [];
  if (recordIds.length > 0) {
    const { data: events } = await supabase
      .from('activity_events')
      .select('id, event_type, entity_type, entity_id, title, description, occurred_at')
      .eq('entity_type', 'employee')
      .in('entity_id', recordIds)
      .order('occurred_at', { ascending: false })
      .limit(20);
    history = (events || []) as OrganizationHistoryEvent[];
  }

  const activeCount = records.filter((record) => record.status === 'active').length;
  const inactiveCount = records.filter((record) => record.status === 'inactive').length;
  const archivedCount = records.filter((record) => record.status === 'archived').length;
  const now = new Date();
  const newThisMonth = records.filter((record) => {
    const created = new Date(record.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const departmentMap = new Map<string, number>();
  for (const record of records) {
    const department = record.department_name || record.department || 'Sem departamento';
    departmentMap.set(department, (departmentMap.get(department) || 0) + 1);
  }
  const chartColors = ['#2f76d2', '#12a36d', '#f5a308', '#8a5bd2', '#ef4444'];
  const departmentData: DonutItem[] = Array.from(departmentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({ label, value, color: chartColors[index] }));
  const statusData: DonutItem[] = [
    { label: 'Ativos', value: activeCount, color: '#12a36d' },
    { label: 'Afastados/Inativos', value: inactiveCount, color: '#f5a308' },
    { label: 'Desligados', value: archivedCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);
  const employeeSeries = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    month.setMonth(month.getMonth() - (5 - index));
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
    return {
      label: month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      value: records.filter((record) => new Date(record.created_at) <= monthEnd).length,
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Colaboradores"
        subtitle="Gerencie todos os colaboradores da sua empresa."
        userName="Empresa"
        notifications={history.length}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Total de Colaboradores"
          value={records.length}
          icon={Users}
          tone="blue"
          trend="12%"
        />
        <MetricCard label="Ativos" value={activeCount} icon={UserCheck} tone="teal" trend="14%" />
        <MetricCard
          label="Afastados"
          value={inactiveCount}
          icon={Clock3}
          tone="orange"
          trend="14%"
          trendDirection="down"
        />
        <MetricCard
          label="Desligados"
          value={archivedCount}
          icon={UserMinus}
          tone="red"
          trend="9%"
          trendDirection="down"
        />
        <MetricCard
          label="Novos (mês)"
          value={newThisMonth}
          icon={UserPlus}
          tone="purple"
          trend="20%"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <WorkspacePanel
          title="Evolução de Colaboradores"
          action={
            <span className="rounded-lg border px-3 py-1.5 text-[10px] text-slate-600">
              Últimos 6 meses⌄
            </span>
          }
        >
          <TrendChart data={employeeSeries} color="#2563eb" height={220} />
        </WorkspacePanel>
        <WorkspacePanel title="Colaboradores por Departamento">
          {departmentData.length ? (
            <DonutChart
              data={departmentData}
              centerValue={records.length}
              centerLabel="Total"
              height={205}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhum departamento informado." />
          )}
        </WorkspacePanel>
        <WorkspacePanel title="Colaboradores por Situação">
          {statusData.length ? (
            <DonutChart
              data={statusData}
              centerValue={records.length}
              centerLabel="Total"
              height={205}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhum colaborador cadastrado." />
          )}
        </WorkspacePanel>
      </section>

      <OrganizationRecordsClient
        resource="employees"
        title="Colaboradores"
        subtitle="Cadastro individual, desligamento, reativação e histórico real dos colaboradores."
        initialRecords={records}
        references={{
          branches: (branches || []) as Pick<BranchRecord, 'id' | 'name' | 'status'>[],
          departments: (departments || []) as Pick<
            DepartmentRecord,
            'id' | 'name' | 'branch_id' | 'status'
          >[],
          positions: (positions || []) as Pick<
            PositionRecord,
            'id' | 'name' | 'department_id' | 'status'
          >[],
        }}
        history={history}
        canManage={canManageCompanyOrganization(membership.role)}
        hideOverview
      />
    </div>
  );
}
