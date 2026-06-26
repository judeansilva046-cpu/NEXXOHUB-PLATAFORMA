'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  HeartPulse,
  Hospital,
  Lightbulb,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardData = {
  user: { name: string; role: string; email?: string };
  metrics: {
    activeCompanies: number;
    activeClinics: number;
    monitoredEmployees: number;
    psychosocialIndex: number | null;
  };
  indexSeries: Array<{ score: number; period_end: string; sample_size: number }>;
  alerts: Array<{
    id: string;
    title: string;
    description?: string;
    severity: string;
    detected_at: string;
  }>;
  insight: null | {
    id: string;
    title: string;
    summary: string;
    recommendation?: string;
  };
  activities: Array<{
    id: string;
    event_type: string;
    title: string;
    description?: string;
    occurred_at: string;
  }>;
};

const periods = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: '12 meses', days: 365 },
];

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
  color: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Dados do período selecionado</p>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
      <Sparkles className="mb-3 h-6 w-6 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/summary?days=${days}`, { cache: 'no-store' })
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
      )
      .finally(() => setLoading(false));
  }, [days]);

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Carregando indicadores reais...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Não foi possível carregar o dashboard. {error}
      </div>
    );
  }

  if (!data) return null;

  const firstName = data.user.name?.split(' ')[0] || 'Usuário';

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Olá, {firstName}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-2 text-lg text-slate-600">Bem-vindo ao NexxoHub</p>
        <p className="mt-1 text-sm text-slate-500">
          Monitoramento psicossocial corporativo em tempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Empresas Ativas"
          value={String(data.metrics.activeCompanies)}
          icon={Building2}
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Clínicas Ativas"
          value={String(data.metrics.activeClinics)}
          icon={Hospital}
          color="bg-cyan-50 text-cyan-600"
        />
        <MetricCard
          label="Colaboradores Monitorados"
          value={data.metrics.monitoredEmployees.toLocaleString('pt-BR')}
          icon={Users}
          color="bg-violet-50 text-violet-600"
        />
        <MetricCard
          label="Índice de Saúde Psicossocial"
          value={
            data.metrics.psychosocialIndex === null
              ? '—'
              : `${data.metrics.psychosocialIndex.toLocaleString('pt-BR')}/100`
          }
          icon={HeartPulse}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Evolução do Índice de Saúde Psicossocial
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Série calculada a partir de avaliações concluídas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <button
                  key={period.days}
                  onClick={() => setDays(period.days)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    days === period.days
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 h-[330px]">
            {data.indexSeries.length === 0 ? (
              <EmptyState message="Nenhum índice calculado para o período. Conclua avaliações para gerar a série histórica." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.indexSeries}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period_end"
                    tickFormatter={(value) =>
                      new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })
                    }
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-950">Alertas Inteligentes</h2>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            {data.alerts.length === 0 ? (
              <EmptyState message="Nenhum alerta ativo no momento." />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.alerts.map((alert) => (
                  <article key={alert.id} className="py-3">
                    <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{alert.description}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-violet-600" />
              <h2 className="font-semibold text-slate-950">Insights da IA</h2>
            </div>
            {!data.insight ? (
              <EmptyState message="Nenhum insight disponível no momento." />
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900">{data.insight.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{data.insight.summary}</p>
                {data.insight.recommendation && (
                  <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    {data.insight.recommendation}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-950">Atividades Recentes</h2>
        </div>
        {data.activities.length === 0 ? (
          <EmptyState message="Nenhuma atividade registrada ainda." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.activities.map((activity) => (
              <article key={activity.id} className="rounded-xl border border-slate-100 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="mt-3 text-sm font-semibold text-slate-900">{activity.title}</p>
                <p className="mt-1 text-xs text-slate-500">{activity.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
