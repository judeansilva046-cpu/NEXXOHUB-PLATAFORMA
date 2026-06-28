'use client';

import {
  BellRing,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  Database,
  HardDrive,
  Hospital,
  PlugZap,
  Server,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  DonutChart,
  TrendChart,
  type DonutItem,
  type TrendPoint,
} from '../../components/workspace/charts';
import { MetricCard } from '../../components/workspace/metric-card';
import { PageHeader } from '../../components/workspace/page-header';
import { EmptyWorkspaceState, WorkspacePanel } from '../../components/workspace/panel';

type DashboardData = {
  user: { name: string; role: string; email?: string };
  metrics: {
    activeCompanies: number;
    activeClinics: number;
    monitoredEmployees: number;
    psychosocialIndex: number | null;
  };
  clinicSeries: TrendPoint[];
  planDistribution: Array<{ label: string; value: number }>;
  alerts: Array<{
    id: string;
    title: string;
    description?: string;
    severity: string;
    detected_at: string;
  }>;
  activities: Array<{
    id: string;
    event_type: string;
    title: string;
    description?: string;
    occurred_at: string;
  }>;
  unreadNotifications: number;
  finance: { activeContracts: number; expectedRevenue: number };
};

const palette = ['#20ad9a', '#2f76d2', '#f59e0b', '#8b5ccf', '#ef4444'];
const platformServices: Array<[string, LucideIcon]> = [
  ['Servidores', Server],
  ['Banco de Dados', Database],
  ['API', PlugZap],
  ['Armazenamento', HardDrive],
  ['Backup', Cloud],
];

function currency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/summary?days=180', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Erro ao carregar');
        return result.data as DashboardData;
      })
      .then(setData)
      .catch((requestError) =>
        setError(
          requestError instanceof Error ? requestError.message : 'Erro ao carregar dashboard'
        )
      );
  }, []);

  if (!data && !error)
    return (
      <div className="py-24 text-center text-sm text-slate-500">
        Carregando dashboard executivo...
      </div>
    );

  const planData: DonutItem[] = (data?.planDistribution || []).map((item, index) => ({
    ...item,
    color: palette[index % palette.length],
  }));
  const usage = [
    {
      label: 'Armazenamento',
      value: Math.min(100, Math.max(8, data?.metrics.activeCompanies || 0)),
      detail: `${data?.metrics.activeCompanies || 0} empresas`,
    },
    {
      label: 'Usuários Ativos',
      value: Math.min(100, Math.round(((data?.metrics.monitoredEmployees || 0) / 3000) * 100)),
      detail: `${(data?.metrics.monitoredEmployees || 0).toLocaleString('pt-BR')} / 3.000`,
    },
    {
      label: 'Contratos',
      value: Math.min(100, (data?.finance.activeContracts || 0) * 10),
      detail: `${data?.finance.activeContracts || 0} ativos`,
    },
    { label: 'Integrações', value: 20, detail: 'Ambiente base' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard Executivo"
        subtitle="Visão geral da plataforma NexxoHub."
        userName={data?.user.name || 'NexxoHub Admin'}
        notifications={data?.unreadNotifications || 0}
      />
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <MetricCard
              label="Clínicas Ativas"
              value={data.metrics.activeClinics}
              icon={Hospital}
              tone="teal"
              trend="12%"
            />
            <MetricCard
              label="Empresas"
              value={data.metrics.activeCompanies}
              icon={Building2}
              tone="blue"
              trend="15%"
            />
            <MetricCard
              label="Colaboradores"
              value={data.metrics.monitoredEmployees.toLocaleString('pt-BR')}
              icon={Users}
              tone="teal"
              trend="18%"
            />
            <MetricCard
              label="Receita Prevista"
              value={currency(data.finance.expectedRevenue)}
              icon={CircleDollarSign}
              tone="teal"
              trend="24%"
            />
            <MetricCard
              label="Alertas Abertos"
              value={data.alerts.length}
              icon={BellRing}
              tone="orange"
              trend={data.alerts.length ? '8%' : '0%'}
              trendDirection={data.alerts.length ? 'down' : 'up'}
            />
          </section>

          <section className="grid gap-3 xl:grid-cols-[1fr_0.95fr_0.95fr]">
            <WorkspacePanel
              title="Evolução de Clínicas Ativas"
              action={
                <span className="rounded-lg border px-3 py-1.5 text-[10px] text-slate-600">
                  Últimos 6 meses⌄
                </span>
              }
            >
              <TrendChart data={data.clinicSeries || []} color="#10a89b" height={235} />
            </WorkspacePanel>

            <WorkspacePanel title="Distribuição de Clínicas por Plano">
              {planData.length ? (
                <DonutChart
                  data={planData}
                  centerValue={data.metrics.activeClinics}
                  centerLabel="Total"
                  height={220}
                />
              ) : (
                <EmptyWorkspaceState message="Nenhuma assinatura ativa vinculada a planos." />
              )}
            </WorkspacePanel>

            <WorkspacePanel title="Status da Plataforma">
              <div className="space-y-2.5 pt-1">
                {platformServices.map(([label, Icon]) => (
                  <div
                    key={String(label)}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-xs font-medium text-[#071737]">{label}</span>
                    <span className="text-[10px] font-medium text-emerald-600">Operacional</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          </section>

          <section className="grid gap-3 xl:grid-cols-[0.95fr_1fr_1.2fr]">
            <WorkspacePanel
              title="Atividades Recentes"
              footerLabel="Ver todas as atividades"
              footerHref="/dashboard/audit"
            >
              <div className="divide-y divide-slate-100">
                {data.activities.map((activity, index) => (
                  <article key={activity.id} className="flex gap-3 py-3 first:pt-0">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${index % 2 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{activity.title}</p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {activity.description || activity.event_type}
                      </p>
                    </div>
                    <time className="text-[9px] text-slate-400">
                      {new Date(activity.occurred_at).toLocaleDateString('pt-BR')}
                    </time>
                  </article>
                ))}
                {!data.activities.length && (
                  <EmptyWorkspaceState message="Nenhuma atividade recente." />
                )}
              </div>
            </WorkspacePanel>

            <WorkspacePanel
              title="Alertas do Sistema"
              footerLabel="Ver todos os alertas"
              footerHref="/dashboard/logs"
            >
              <div className="space-y-2.5">
                {data.alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-xl border border-red-100 bg-red-50/65 p-3"
                  >
                    <p className="text-xs font-semibold text-red-700">{alert.title}</p>
                    <p className="mt-1 text-[10px] text-red-500">
                      {alert.description || alert.severity}
                    </p>
                  </article>
                ))}
                {!data.alerts.length && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-700">
                    Nenhum alerta ativo. A plataforma está operando normalmente.
                  </div>
                )}
              </div>
            </WorkspacePanel>

            <WorkspacePanel
              title="Uso da Plataforma"
              footerLabel="Ver relatórios completos"
              footerHref="/dashboard/reports"
            >
              <div className="space-y-5 pt-2">
                {usage.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <span className="text-[#142343]">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <span className="w-24 text-right text-[9px] text-slate-500">
                        {item.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          </section>
        </>
      )}
    </div>
  );
}
