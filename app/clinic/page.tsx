import {
  Activity,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileChartColumn,
  FileCheck2,
  GraduationCap,
  HandHeart,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  FlowHubGrid,
  ImplementationChecklistPanel,
  NextActionPanel,
  type FlowHub,
  type GuidedAction,
} from '../../components/clinic/guided-workspace';
import { MetricCard } from '../../components/workspace/metric-card';
import { PageHeader } from '../../components/workspace/page-header';
import { EmptyWorkspaceState, WorkspacePanel } from '../../components/workspace/panel';
import { AuthorizationError } from '../../lib/errors';
import { loadClinicWorkspaceSnapshot } from '../../lib/clinic-guidance';
import { requirePortalContext } from '../../lib/portal-context';

function buildActions(snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>) {
  const actions: GuidedAction[] = [];

  if (snapshot.metrics.activeCompanies === 0) {
    actions.push({
      title: 'Cadastrar a primeira empresa',
      description: 'Comece criando a empresa cliente que a clínica vai acompanhar.',
      href: '/clinic/companies',
      cta: 'Cadastrar empresa',
      tone: 'green',
      icon: Building2,
      meta: 'início',
    });
  }

  if (snapshot.metrics.pendingImplementations > 0) {
    actions.push({
      title: 'Concluir implantação',
      description: `${snapshot.metrics.pendingImplementations} empresa(s) ainda têm etapas pendentes no checklist guiado.`,
      href: '/clinic/companies',
      cta: 'Ver checklist',
      tone: 'orange',
      icon: CheckCircle2,
      meta: `${snapshot.metrics.averageImplementation}% médio`,
    });
  }

  if (snapshot.metrics.publishedPgrs < snapshot.metrics.activeCompanies) {
    actions.push({
      title: 'Regularizar NR-1/PGR',
      description: 'Publique PGR, acompanhe evidências e gere o dossiê auditável das empresas.',
      href: '/clinic/compliance',
      cta: 'Abrir conformidade',
      tone: 'blue',
      icon: ShieldCheck,
      meta: `${snapshot.metrics.publishedPgrs} PGR`,
    });
  }

  if (snapshot.metrics.activePrograms === 0 || snapshot.metrics.activeLessons === 0) {
    actions.push({
      title: 'Publicar conteúdos',
      description: 'Crie programas, trilhas, módulos e aulas para sustentar as ações preventivas.',
      href: '/clinic/content',
      cta: 'Montar conteúdo',
      tone: 'purple',
      icon: GraduationCap,
      meta: `${snapshot.metrics.activeLessons} aulas`,
    });
  }

  if (
    snapshot.metrics.openCareRequests > 0 ||
    snapshot.metrics.openComplaints > 0 ||
    snapshot.metrics.openTechnicalCases > 0
  ) {
    actions.push({
      title: 'Atender pendências técnicas',
      description: 'Existem pedidos, denúncias ou casos que precisam de acompanhamento clínico.',
      href: '/clinic/follow-up',
      cta: 'Acompanhar agora',
      tone: 'red',
      icon: HandHeart,
      meta: String(snapshot.metrics.openCareRequests + snapshot.metrics.openComplaints),
    });
  }

  if (!actions.length) {
    actions.push({
      title: 'Gerar relatório executivo',
      description: 'A operação está consistente. Exporte relatórios para a clínica e clientes.',
      href: '/clinic/reports',
      cta: 'Abrir relatórios',
      tone: 'green',
      icon: FileChartColumn,
      meta: 'ok',
    });
  }

  return actions.slice(0, 3);
}

function buildHubs(snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>): FlowHub[] {
  return [
    {
      title: 'Empresas',
      description: 'Cadastro, implantação rápida e visão da carteira atendida pela clínica.',
      href: '/clinic/companies',
      icon: Building2,
      tone: 'green',
      metricLabel: 'ativas',
      metricValue: snapshot.metrics.activeCompanies,
      cta: 'Gerenciar',
    },
    {
      title: 'Conformidade NR-1/PGR',
      description: 'Diagnósticos, PGR, planos de ação, evidências e dossiês auditáveis.',
      href: '/clinic/compliance',
      icon: ShieldCheck,
      tone: 'blue',
      metricLabel: 'dossiês',
      metricValue: snapshot.metrics.generatedDossiers,
      cta: 'Conferir',
    },
    {
      title: 'Conteúdos e treinamentos',
      description: 'Programas, trilhas, aulas, recursos e certificados emitidos.',
      href: '/clinic/content',
      icon: BookOpen,
      tone: 'purple',
      metricLabel: 'programas',
      metricValue: snapshot.metrics.activePrograms,
      cta: 'Publicar',
    },
    {
      title: 'Acompanhamento',
      description: 'Colaboradores, pedidos de ajuda, denúncias, casos técnicos e alertas.',
      href: '/clinic/follow-up',
      icon: Activity,
      tone: 'orange',
      metricLabel: 'pendências',
      metricValue:
        snapshot.metrics.openCareRequests +
        snapshot.metrics.openComplaints +
        snapshot.metrics.openTechnicalCases,
      cta: 'Monitorar',
    },
    {
      title: 'Relatórios',
      description: 'Indicadores consolidados, relatórios técnicos e prestação de contas.',
      href: '/clinic/reports',
      icon: FileChartColumn,
      tone: 'slate',
      metricLabel: 'implantação',
      metricValue: `${snapshot.metrics.averageImplementation}%`,
      cta: 'Exportar',
    },
  ];
}

export default async function ClinicPortalPage() {
  const { supabase, membership } = await requirePortalContext('clinic');

  if (!membership.clinic_id) {
    throw new AuthorizationError('A clínica não foi encontrada para este usuário.');
  }

  const snapshot = await loadClinicWorkspaceSnapshot(supabase, {
    clinicId: membership.clinic_id,
    organizationId: membership.organization_id,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard Clínica"
        subtitle="Fluxo guiado para implantar empresas, cumprir NR-1/PGR e acompanhar riscos psicossociais."
        userName="Clínica"
        notifications={snapshot.metrics.technicalPendencies}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Empresas ativas"
          value={snapshot.metrics.activeCompanies}
          icon={Building2}
          tone="teal"
        />
        <MetricCard
          label="Colaboradores monitorados"
          value={snapshot.metrics.collaborators.toLocaleString('pt-BR')}
          icon={Users}
          tone="blue"
        />
        <MetricCard
          label="Implantação média"
          value={`${snapshot.metrics.averageImplementation}%`}
          icon={CheckCircle2}
          tone="purple"
        />
        <MetricCard
          label="Pendências técnicas"
          value={snapshot.metrics.technicalPendencies}
          icon={ClipboardCheck}
          tone={snapshot.metrics.technicalPendencies ? 'orange' : 'teal'}
        />
        <MetricCard
          label="Programas ativos"
          value={snapshot.metrics.activePrograms}
          icon={GraduationCap}
          tone="cyan"
        />
        <MetricCard
          label="Dossiês NR-1 gerados"
          value={snapshot.metrics.generatedDossiers}
          icon={FileCheck2}
          tone="red"
        />
      </section>

      <NextActionPanel actions={buildActions(snapshot)} />
      <FlowHubGrid hubs={buildHubs(snapshot)} />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.7fr)]">
        <ImplementationChecklistPanel implementations={snapshot.implementations} />

        <WorkspacePanel
          title="Atividades sincronizadas"
          footerLabel="Ver relatórios"
          footerHref="/clinic/reports"
        >
          <div className="divide-y divide-slate-100">
            {snapshot.activities.map((activity) => (
              <article key={activity.id} className="py-3 first:pt-0">
                <p className="text-xs font-semibold text-[#071737]">{activity.title}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {activity.description || activity.event_type}
                </p>
                <time className="mt-2 block text-[10px] text-slate-400">
                  {new Date(activity.occurred_at).toLocaleString('pt-BR')}
                </time>
              </article>
            ))}
            {!snapshot.activities.length && (
              <EmptyWorkspaceState message="Nenhuma atividade registrada ainda." />
            )}
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
