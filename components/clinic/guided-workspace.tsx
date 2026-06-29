import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  type LucideIcon,
  PlayCircle,
} from 'lucide-react';
import type { CompanyImplementation, StatusTone, StepStatus } from '../../lib/clinic-guidance';
import { EmptyWorkspaceState, StatusPill, WorkspacePanel } from '../workspace/panel';

export type GuidedAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: StatusTone;
  icon: LucideIcon;
  meta?: string;
};

export type FlowHub = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: StatusTone;
  metricLabel: string;
  metricValue: string | number;
  cta: string;
};

const toneClasses: Record<StatusTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  purple: 'bg-violet-50 text-violet-700 ring-violet-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const stepVisuals: Record<
  StepStatus,
  { label: string; tone: StatusTone; icon: LucideIcon; line: string }
> = {
  completed: {
    label: 'Concluído',
    tone: 'green',
    icon: CheckCircle2,
    line: 'border-emerald-200',
  },
  in_progress: {
    label: 'Em andamento',
    tone: 'blue',
    icon: PlayCircle,
    line: 'border-blue-200',
  },
  pending: {
    label: 'Pendente',
    tone: 'orange',
    icon: Circle,
    line: 'border-orange-200',
  },
  overdue: {
    label: 'Atrasado',
    tone: 'red',
    icon: Clock3,
    line: 'border-red-200',
  },
};

export function NextActionPanel({
  title = 'O que fazer agora?',
  subtitle = 'A plataforma prioriza o próximo passo com base nos dados reais do portal.',
  actions,
}: {
  title?: string;
  subtitle?: string;
  actions: GuidedAction[];
}) {
  return (
    <WorkspacePanel title={title}>
      <div className="mb-4 rounded-xl bg-cyan-50/70 px-4 py-3 text-xs text-cyan-950">
        {subtitle}
      </div>
      {actions.length ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={`${action.href}-${action.title}`}
                href={action.href}
                className="group flex min-h-36 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
              >
                <div>
                  <span
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClasses[action.tone]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#071737]">{action.title}</h3>
                    {action.meta && <StatusPill label={action.meta} tone={action.tone} />}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{action.description}</p>
                </div>
                <span className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-700">
                  {action.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyWorkspaceState message="Tudo certo por enquanto. Novas recomendações aparecerão conforme os registros forem atualizados." />
      )}
    </WorkspacePanel>
  );
}

export function FlowHubGrid({ hubs }: { hubs: FlowHub[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {hubs.map((hub) => {
        const Icon = hub.icon;
        return (
          <Link
            key={hub.href}
            href={hub.href}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClasses[hub.tone]}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-[-0.04em] text-[#071737]">
                  {hub.metricValue}
                </p>
                <p className="text-[10px] text-slate-500">{hub.metricLabel}</p>
              </div>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#071737]">{hub.title}</h3>
            <p className="mt-2 min-h-12 text-xs leading-5 text-slate-600">{hub.description}</p>
            <span className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-700">
              {hub.cta}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </section>
  );
}

export function ImplementationChecklistPanel({
  implementations,
  limit = 4,
}: {
  implementations: CompanyImplementation[];
  limit?: number;
}) {
  const visible = implementations.slice(0, limit);
  return (
    <WorkspacePanel
      title="Implantação guiada das empresas"
      footerLabel="Ver todas as empresas"
      footerHref="/clinic/companies"
    >
      {visible.length ? (
        <div className="space-y-3">
          {visible.map((company) => (
            <article key={company.companyId} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#071737]">{company.companyName}</h3>
                    <StatusPill label={company.statusLabel} tone={company.statusTone} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {company.completed} de {company.total} etapas concluídas
                  </p>
                </div>
                <div className="min-w-40">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Progresso</span>
                    <strong className="text-[#071737]">{company.progress}%</strong>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      style={{ width: `${company.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              {company.nextStep ? (
                <Link
                  href={company.nextStep.href}
                  className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-700 transition hover:bg-cyan-50"
                >
                  <span>
                    Próximo passo:{' '}
                    <strong className="font-semibold text-[#071737]">
                      {company.nextStep.label}
                    </strong>
                  </span>
                  <ArrowRight className="h-4 w-4 text-blue-700" />
                </Link>
              ) : (
                <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-medium text-emerald-700">
                  Implantação completa. A empresa já pode operar o fluxo NR-1 ponta a ponta.
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyWorkspaceState message="Cadastre a primeira empresa para iniciar a implantação guiada." />
      )}
    </WorkspacePanel>
  );
}

export function StepTimeline({ implementation }: { implementation: CompanyImplementation }) {
  return (
    <div className="space-y-2">
      {implementation.steps.map((step, index) => {
        const visual = stepVisuals[step.status];
        const Icon = visual.icon;
        return (
          <Link
            key={step.key}
            href={step.href}
            className={`grid gap-3 rounded-xl border bg-white p-3 transition hover:bg-slate-50 sm:grid-cols-[auto_minmax(0,1fr)_auto] ${visual.line}`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 ${toneClasses[visual.tone]}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-[#071737]">
                {index + 1}. {step.label}
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                {step.description}
              </span>
            </span>
            <span className="flex items-center gap-2 sm:justify-end">
              <StatusPill label={visual.label} tone={visual.tone} />
              <span className="text-[10px] text-slate-400">{step.owner}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
