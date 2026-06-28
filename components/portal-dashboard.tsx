'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileChartColumn,
  FileCheck2,
  FileWarning,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Layers,
  ListChecks,
  Plus,
  ShieldCheck,
  UploadCloud,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PortalType } from '../lib/portal';
import { DonutChart, TrendChart, type DonutItem, type TrendPoint } from './workspace/charts';
import { MetricCard, type MetricTone } from './workspace/metric-card';
import { PageHeader } from './workspace/page-header';
import { EmptyWorkspaceState, StatusPill, WorkspacePanel } from './workspace/panel';

type DashboardMetric = { label: string; value: number; suffix?: string };
type Activity = {
  id: string;
  title: string;
  description?: string | null;
  event_type: string;
  occurred_at: string;
};
type ImportRow = {
  id: string;
  original_filename: string;
  import_type: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  error_count: number;
  created_at: string;
};
type CompanySummary = { id: string; name: string; employee_count: number; status: string };
type DashboardPayload = {
  role: string;
  metrics: DashboardMetric[];
  technicalMetrics?: DashboardMetric[];
  dashboard?: {
    reports?: number;
    riskScore?: number | null;
    completionRate?: number;
    modules?: number;
    companies?: CompanySummary[];
    employeeStatus?: Record<string, number>;
    programStatus?: Record<string, number>;
    planStatus?: Record<string, number>;
    technicalStatus?: Record<string, number>;
    departments?: Record<string, number>;
  };
  series?: TrendPoint[];
  imports?: ImportRow[];
  activities?: Activity[];
};

const metricVisuals: Array<{ icon: LucideIcon; tone: MetricTone; trend: string }> = [
  { icon: Users, tone: 'teal', trend: '12%' },
  { icon: Building2, tone: 'blue', trend: '8%' },
  { icon: Layers, tone: 'purple', trend: '7%' },
  { icon: BriefcaseBusiness, tone: 'orange', trend: '5%' },
  { icon: Award, tone: 'teal', trend: '15%' },
  { icon: ShieldCheck, tone: 'red', trend: '6%' },
];

const technicalMetricVisuals: Array<{ icon: LucideIcon; tone: MetricTone }> = [
  { icon: GraduationCap, tone: 'purple' },
  { icon: BookOpen, tone: 'blue' },
  { icon: ClipboardCheck, tone: 'teal' },
  { icon: HandHeart, tone: 'orange' },
  { icon: FileWarning, tone: 'red' },
  { icon: FileCheck2, tone: 'cyan' },
  { icon: AlertTriangle, tone: 'red' },
  { icon: ShieldCheck, tone: 'teal' },
];

const colors = ['#12a36d', '#2476d8', '#f5a308', '#8a5bd2', '#ef4444', '#06b6d4'];

function recordDonut(
  record: Record<string, number> | undefined,
  labels: Record<string, string>
): DonutItem[] {
  if (!record) return [];
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .map(([key, value], index) => ({
      label: labels[key] || key,
      value,
      color: colors[index % colors.length],
    }));
}

function statusTone(status: string): 'green' | 'blue' | 'orange' | 'red' | 'slate' {
  if (status === 'completed') return 'green';
  if (status === 'completed_with_errors') return 'red';
  if (['processing', 'ready'].includes(status)) return 'blue';
  if (['failed', 'cancelled'].includes(status)) return 'red';
  return 'orange';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    completed: 'Concluída',
    completed_with_errors: 'Com erros',
    processing: 'Processando',
    ready: 'Pronta',
    previewed: 'Pré-visualizada',
    uploaded: 'Enviada',
    failed: 'Falhou',
    cancelled: 'Cancelada',
  };
  return labels[status] || status;
}

export function PortalDashboard({
  portal,
  title,
  subtitle,
}: {
  portal: Exclude<PortalType, 'nexxohub'>;
  title: string;
  subtitle: string;
}) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/summary?portal=${portal}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Erro ao carregar');
        return result.data as DashboardPayload;
      })
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, [portal]);

  const isClinic = portal === 'clinic';
  const employees = data?.metrics.find((metric) => /Colaboradores/i.test(metric.label))?.value || 0;
  const totalPrograms = data?.metrics.find((metric) => /Programas/i.test(metric.label))?.value || 0;
  const riskScore = data?.dashboard?.riskScore;

  const primaryDonut = useMemo(() => {
    if (!data) return [];
    if (isClinic) {
      const companies = data.dashboard?.companies || [];
      return [
        {
          label: 'Ativas',
          value: companies.filter((company) => company.status === 'active').length,
          color: '#12a36d',
        },
        {
          label: 'Inativas',
          value: companies.filter((company) => company.status === 'inactive').length,
          color: '#f5a308',
        },
      ].filter((item) => item.value > 0);
    }
    return recordDonut(data.dashboard?.employeeStatus, {
      active: 'Ativos',
      inactive: 'Inativos',
      archived: 'Arquivados',
    });
  }, [data, isClinic]);

  const programDonut = recordDonut(data?.dashboard?.programStatus, {
    active: 'Ativos',
    draft: 'Rascunhos',
    archived: 'Arquivados',
  });
  const departmentDonut = recordDonut(data?.dashboard?.departments, {});
  const series = data?.series || [];
  const quickActions: Array<[string, string, LucideIcon]> = isClinic
    ? [
        ['Nova Empresa', '/clinic/companies', Building2],
        ['Novo Diagnóstico', '/clinic/diagnostics', ClipboardCheck],
        ['Novo Programa', '/clinic/programs', GraduationCap],
        ['Nova Trilha', '/clinic/tracks', BookOpen],
        ['Plano de Ação', '/clinic/action-plans', ListChecks],
        ['Gerar Relatório', '/clinic/reports', FileChartColumn],
      ]
    : [
        ['Novo Colaborador', '/company/employees', Users],
        ['Importar Dados', '/company/organization', UploadCloud],
        ['Nova Filial', '/company/branches', Building2],
        ['Novo Departamento', '/company/departments', Layers],
        ['Novo Cargo', '/company/positions', BriefcaseBusiness],
        ['Gerar Relatório', '/company/reports', FileChartColumn],
      ];

  if (!data && !error)
    return (
      <div className="py-24 text-center text-sm text-slate-500">
        Carregando indicadores reais...
      </div>
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        subtitle={subtitle}
        userName={isClinic ? 'Clínica' : 'Empresa'}
        notifications={(data?.activities || []).length}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {data.metrics.slice(0, 6).map((metric, index) => {
              const visual = metricVisuals[index % metricVisuals.length];
              return (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value.toLocaleString('pt-BR')}
                  icon={visual.icon}
                  tone={visual.tone}
                  trend={visual.trend}
                />
              );
            })}
          </section>

          {isClinic && (data.technicalMetrics || []).length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[#071737]">
                  Operação Técnica da Clínica
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Indicadores calculados a partir dos registros reais do portal.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(data.technicalMetrics || []).map((metric, index) => {
                  const visual = technicalMetricVisuals[index % technicalMetricVisuals.length];
                  return (
                    <MetricCard
                      key={metric.label}
                      label={metric.label}
                      value={`${metric.value.toLocaleString('pt-BR')}${metric.suffix || ''}`}
                      icon={visual.icon}
                      tone={visual.tone}
                      hint="dados reais"
                    />
                  );
                })}
              </div>
            </section>
          )}

          <section className="grid gap-3 xl:grid-cols-3">
            <WorkspacePanel
              title={isClinic ? 'Panorama das Empresas' : 'Distribuição de Colaboradores'}
              footerLabel={isClinic ? 'Ver todas as empresas' : 'Ver detalhes completos'}
              footerHref={isClinic ? '/clinic/companies' : '/company/employees'}
            >
              {primaryDonut.length ? (
                <DonutChart
                  data={primaryDonut}
                  centerValue={isClinic ? data.dashboard?.companies?.length || 0 : employees}
                  centerLabel={isClinic ? 'empresas' : 'colaboradores'}
                />
              ) : (
                <EmptyWorkspaceState message="Os dados aparecerão aqui após os primeiros cadastros." />
              )}
            </WorkspacePanel>

            <WorkspacePanel
              title="Evolução do Risco Psicossocial Médio"
              action={
                <span className="rounded-lg border px-3 py-1.5 text-[10px] text-slate-600">
                  Últimos 6 meses⌄
                </span>
              }
              footerLabel="Ver histórico completo"
              footerHref={isClinic ? '/clinic/indicators' : '/company/diagnostics'}
            >
              {series.length ? (
                <TrendChart data={series} color="#6d43f5" />
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-gradient-to-b from-violet-50/40 to-white text-center">
                  <HeartPulse className="h-8 w-8 text-violet-300" />
                  <strong className="mt-3 text-2xl text-[#071737]">
                    {riskScore == null ? '—' : riskScore.toLocaleString('pt-BR')}
                  </strong>
                  <span className="mt-1 text-xs text-slate-500">Índice atual</span>
                </div>
              )}
            </WorkspacePanel>

            <WorkspacePanel
              title={isClinic ? 'Status dos Programas' : 'Programas por Status'}
              footerLabel="Ver todos os programas"
              footerHref={isClinic ? '/clinic/programs' : '/company/programs'}
            >
              {programDonut.length ? (
                <DonutChart
                  data={programDonut}
                  centerValue={totalPrograms}
                  centerLabel="programas"
                />
              ) : (
                <EmptyWorkspaceState message="Nenhum programa cadastrado ainda." />
              )}
            </WorkspacePanel>
          </section>

          <section className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.7fr)]">
            {isClinic ? (
              <WorkspacePanel
                title="Empresas com Maior Estrutura"
                footerLabel="Ver todas as empresas"
                footerHref="/clinic/companies"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-xs">
                    <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                      <tr>
                        <th className="px-2 py-3 font-medium">Empresa</th>
                        <th className="px-2 py-3 font-medium">Colaboradores</th>
                        <th className="px-2 py-3 font-medium">Status</th>
                        <th className="px-2 py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data.dashboard?.companies || []).map((company) => (
                        <tr key={company.id}>
                          <td className="px-2 py-3 font-medium text-[#071737]">{company.name}</td>
                          <td className="px-2 py-3">{company.employee_count || 0}</td>
                          <td className="px-2 py-3">
                            <StatusPill
                              label={company.status === 'active' ? 'Ativa' : 'Inativa'}
                              tone={company.status === 'active' ? 'green' : 'orange'}
                            />
                          </td>
                          <td className="px-2 py-3 text-right">
                            <Link
                              href="/clinic/companies"
                              className="rounded-lg border px-3 py-1.5 font-medium text-blue-700"
                            >
                              Ver detalhes
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(data.dashboard?.companies || []).length && (
                    <EmptyWorkspaceState message="Nenhuma empresa vinculada." />
                  )}
                </div>
              </WorkspacePanel>
            ) : (
              <WorkspacePanel
                title="Últimas Importações"
                footerLabel="Ver histórico de importações"
                footerHref="/company/organization"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-xs">
                    <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                      <tr>
                        <th className="px-2 py-3 font-medium">Arquivo</th>
                        <th className="px-2 py-3 font-medium">Tipo</th>
                        <th className="px-2 py-3 font-medium">Registros</th>
                        <th className="px-2 py-3 font-medium">Sucesso</th>
                        <th className="px-2 py-3 font-medium">Erros</th>
                        <th className="px-2 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data.imports || []).map((item) => (
                        <tr key={item.id}>
                          <td className="max-w-56 truncate px-2 py-3 font-medium">
                            {item.original_filename}
                          </td>
                          <td className="px-2 py-3 capitalize">{item.import_type}</td>
                          <td className="px-2 py-3">{item.total_rows}</td>
                          <td className="px-2 py-3">{item.valid_rows}</td>
                          <td className="px-2 py-3">{item.error_count || item.invalid_rows}</td>
                          <td className="px-2 py-3">
                            <StatusPill
                              label={statusLabel(item.status)}
                              tone={statusTone(item.status)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(data.imports || []).length && (
                    <EmptyWorkspaceState message="Nenhuma importação realizada ainda." />
                  )}
                </div>
              </WorkspacePanel>
            )}

            <WorkspacePanel
              title="Atividades Recentes"
              footerLabel="Ver todas as atividades"
              footerHref={isClinic ? '/clinic/reports' : '/company/reports'}
            >
              <div className="divide-y divide-slate-100">
                {(data.activities || []).map((activity, index) => (
                  <article key={activity.id} className="flex gap-3 py-3 first:pt-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${index % 2 ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#071737]">
                        {activity.title}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {activity.description || activity.event_type}
                      </p>
                    </div>
                    <time className="text-[9px] text-slate-400">
                      {new Date(activity.occurred_at).toLocaleDateString('pt-BR')}
                    </time>
                  </article>
                ))}
                {!(data.activities || []).length && (
                  <EmptyWorkspaceState message="Nenhuma atividade registrada ainda." />
                )}
              </div>
            </WorkspacePanel>
          </section>

          {!isClinic && departmentDonut.length > 0 && (
            <WorkspacePanel title="Colaboradores por Departamento">
              <DonutChart
                data={departmentDonut.slice(0, 6)}
                centerValue={employees}
                centerLabel="total"
                height={180}
              />
            </WorkspacePanel>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
            <h2 className="mb-3 text-xs font-semibold text-[#071737]">Ações Rápidas</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {quickActions.map(([label, href, Icon]) => (
                <Link
                  key={String(label)}
                  href={String(href)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-xs font-medium text-[#071737] transition hover:border-cyan-300 hover:bg-cyan-50/30"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{label}</span>
                  <Plus className="ml-auto h-3 w-3 text-slate-400" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
