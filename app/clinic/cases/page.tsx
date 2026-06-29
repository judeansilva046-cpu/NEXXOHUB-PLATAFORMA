import { AlertTriangle, BriefcaseMedical, ClipboardList, FileText, UserCheck } from 'lucide-react';
import {
  CaseOption,
  TechnicalCaseEditor,
  TechnicalCaseEventEditor,
} from '../../../components/clinic/technical-case-editor';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type CompanyRow = { id: string; name: string };
type EmployeeRow = { id: string; company_id: string; full_name: string; email: string | null };
type TechnicalCaseRow = {
  id: string;
  company_id: string;
  employee_id: string | null;
  title: string;
  summary: string | null;
  case_type: 'monitoring' | 'help_request' | 'complaint' | 'intervention' | 'other';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'referred' | 'closed' | 'archived';
  opened_at: string;
  updated_at: string;
  companies: SupabaseRelation<{ name: string }>;
  employees: SupabaseRelation<{ full_name: string; email: string | null }>;
  technical_case_events: Array<{
    id: string;
    event_type: string;
    title: string;
    description: string | null;
    event_date: string;
  }>;
};

function statusLabel(status: TechnicalCaseRow['status']) {
  const labels = {
    open: 'Aberto',
    in_progress: 'Em acompanhamento',
    referred: 'Encaminhado',
    closed: 'Encerrado',
    archived: 'Arquivado',
  };
  return labels[status];
}

function statusTone(status: TechnicalCaseRow['status']) {
  if (status === 'closed') return 'green';
  if (status === 'archived') return 'slate';
  if (status === 'referred') return 'blue';
  return 'orange';
}

function riskLabel(risk: TechnicalCaseRow['risk_level']) {
  const labels = { low: 'Baixo', medium: 'Médio', high: 'Alto', critical: 'Crítico' };
  return labels[risk];
}

function riskTone(risk: TechnicalCaseRow['risk_level']) {
  if (risk === 'critical' || risk === 'high') return 'red';
  if (risk === 'medium') return 'orange';
  return 'green';
}

export default async function ClinicCasesPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clínica não encontrada.');

  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, name')
    .eq('clinic_id', membership.clinic_id)
    .is('deleted_at', null)
    .order('name');

  const companies = (companiesData || []) as CompanyRow[];
  const companyIds = companies.map((company) => company.id);

  const [{ data: employeesData }, { data: casesData, error }] = await Promise.all([
    companyIds.length
      ? supabase
          .from('employees')
          .select('id, company_id, full_name, email')
          .in('company_id', companyIds)
          .order('full_name')
      : Promise.resolve({ data: [] }),
    supabase
      .from('technical_cases')
      .select(
        'id, company_id, employee_id, title, summary, case_type, risk_level, status, opened_at, updated_at, companies(name), employees(full_name, email), technical_case_events(id, event_type, title, description, event_date)'
      )
      .eq('clinic_id', membership.clinic_id)
      .order('updated_at', { ascending: false }),
  ]);
  if (error) throw error;

  const employees = (employeesData || []) as EmployeeRow[];
  const cases = (casesData || []) as unknown as TechnicalCaseRow[];
  const openCases = cases.filter((item) =>
    ['open', 'in_progress', 'referred'].includes(item.status)
  );
  const criticalCases = cases.filter((item) => ['high', 'critical'].includes(item.risk_level));
  const eventsCount = cases.reduce(
    (total, item) => total + (item.technical_case_events?.length || 0),
    0
  );
  const companyOptions: CaseOption[] = companies.map((company) => ({
    id: company.id,
    label: company.name,
  }));
  const employeeOptions: CaseOption[] = employees.map((employee) => ({
    id: employee.id,
    companyId: employee.company_id,
    label: `${employee.full_name}${employee.email ? ` · ${employee.email}` : ''}`,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Casos Técnicos"
        subtitle="Registre atendimentos, observações, encaminhamentos e intervenções da Clínica."
        userName="Clínica"
        notifications={openCases.length}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Casos Ativos"
          value={openCases.length}
          icon={BriefcaseMedical}
          tone="blue"
        />
        <MetricCard
          label="Risco Alto/Crítico"
          value={criticalCases.length}
          icon={AlertTriangle}
          tone="red"
        />
        <MetricCard
          label="Eventos Registrados"
          value={eventsCount}
          icon={ClipboardList}
          tone="teal"
        />
        <MetricCard
          label="Colaboradores Monitoráveis"
          value={employees.length}
          icon={UserCheck}
          tone="purple"
        />
      </section>

      <WorkspacePanel title="Gestão de Casos Técnicos">
        <div className="mb-4 flex justify-end">
          <TechnicalCaseEditor companies={companyOptions} employees={employeeOptions} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
              <tr>
                <th className="px-3 py-3">Caso</th>
                <th className="px-3 py-3">Empresa</th>
                <th className="px-3 py-3">Colaborador</th>
                <th className="px-3 py-3">Risco</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Eventos</th>
                <th className="px-3 py-3">Atualizado</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#071737]">{item.title}</p>
                    <p className="mt-1 max-w-72 truncate text-[10px] text-slate-500">
                      {item.summary || 'Sem resumo técnico'}
                    </p>
                  </td>
                  <td className="px-3 py-3">{firstRelation(item.companies)?.name || '—'}</td>
                  <td className="px-3 py-3">
                    {firstRelation(item.employees)?.full_name || 'Caso agregado'}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill
                      label={riskLabel(item.risk_level)}
                      tone={riskTone(item.risk_level)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill label={statusLabel(item.status)} tone={statusTone(item.status)} />
                  </td>
                  <td className="px-3 py-3">{item.technical_case_events?.length || 0}</td>
                  <td className="px-3 py-3">
                    {new Date(item.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <TechnicalCaseEventEditor caseId={item.id} />
                      <TechnicalCaseEditor
                        companies={companyOptions}
                        employees={employeeOptions}
                        triggerLabel="Editar"
                        initialValues={{
                          id: item.id,
                          companyId: item.company_id,
                          employeeId: item.employee_id,
                          title: item.title,
                          summary: item.summary,
                          caseType: item.case_type,
                          riskLevel: item.risk_level,
                          status: item.status,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cases.length && <EmptyWorkspaceState message="Nenhum caso técnico registrado ainda." />}
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Últimos Eventos Técnicos">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cases
            .flatMap((item) =>
              (item.technical_case_events || []).map((event) => ({
                ...event,
                caseTitle: item.title,
              }))
            )
            .sort((a, b) => +new Date(b.event_date) - +new Date(a.event_date))
            .slice(0, 6)
            .map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                  <FileText className="h-4 w-4" /> {event.event_type}
                </div>
                <p className="text-sm font-semibold text-[#071737]">{event.title}</p>
                <p className="mt-1 text-xs text-slate-500">{event.caseTitle}</p>
                <p className="mt-3 line-clamp-2 text-xs text-slate-600">
                  {event.description || 'Sem descrição'}
                </p>
              </article>
            ))}
        </div>
        {!eventsCount && <EmptyWorkspaceState message="Nenhum evento técnico registrado ainda." />}
      </WorkspacePanel>
    </div>
  );
}
