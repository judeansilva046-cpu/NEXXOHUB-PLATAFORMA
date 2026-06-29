import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  FileWarning,
  HandHeart,
  HeartPulse,
  Users,
} from 'lucide-react';
import {
  FlowHubGrid,
  ImplementationChecklistPanel,
  NextActionPanel,
  type FlowHub,
  type GuidedAction,
} from '../../../components/clinic/guided-workspace';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import { AuthorizationError } from '../../../lib/errors';
import { loadClinicWorkspaceSnapshot } from '../../../lib/clinic-guidance';
import { requirePortalContext } from '../../../lib/portal-context';

function followUpActions(
  snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>
): GuidedAction[] {
  const openHumanRequests = snapshot.metrics.openCareRequests + snapshot.metrics.openComplaints;

  return [
    {
      title: openHumanRequests ? 'Responder pessoas em atenção' : 'Monitorar canais de cuidado',
      description: openHumanRequests
        ? `${openHumanRequests} pedido(s)/denúncia(s) precisam de triagem da clínica.`
        : 'Pedidos de ajuda e denúncias estão sem pendências abertas no momento.',
      href: '/clinic/employees',
      cta: 'Abrir monitoramento',
      tone: openHumanRequests ? 'red' : 'green',
      icon: HandHeart,
      meta: `${openHumanRequests}`,
    },
    {
      title: snapshot.metrics.openTechnicalCases
        ? 'Atualizar casos técnicos'
        : 'Registrar caso técnico',
      description: 'Casos concentram notas técnicas, encaminhamentos e intervenções.',
      href: '/clinic/cases',
      cta: 'Ver casos',
      tone: snapshot.metrics.openTechnicalCases ? 'orange' : 'blue',
      icon: BriefcaseBusiness,
      meta: `${snapshot.metrics.openTechnicalCases}`,
    },
    {
      title: 'Acompanhar indicadores',
      description: 'Use os indicadores para priorizar empresas, áreas e grupos de maior risco.',
      href: '/clinic/indicators',
      cta: 'Abrir indicadores',
      tone: 'purple',
      icon: HeartPulse,
      meta: `${snapshot.metrics.collaborators}`,
    },
  ];
}

function followUpHubs(
  snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>
): FlowHub[] {
  return [
    {
      title: 'Colaboradores',
      description: 'Pessoas monitoradas por empresas, áreas, cargos e situação.',
      href: '/clinic/employees',
      icon: Users,
      tone: 'green',
      metricLabel: 'monitorados',
      metricValue: snapshot.metrics.collaborators,
      cta: 'Ver base',
    },
    {
      title: 'Pedidos de ajuda',
      description: 'Canal assistido pela clínica para demandas sensíveis.',
      href: '/clinic/employees',
      icon: HandHeart,
      tone: snapshot.metrics.openCareRequests ? 'red' : 'blue',
      metricLabel: 'abertos',
      metricValue: snapshot.metrics.openCareRequests,
      cta: 'Atender',
    },
    {
      title: 'Denúncias',
      description: 'Triagem técnica e registro de encaminhamentos.',
      href: '/clinic/employees',
      icon: FileWarning,
      tone: snapshot.metrics.openComplaints ? 'red' : 'orange',
      metricLabel: 'abertas',
      metricValue: snapshot.metrics.openComplaints,
      cta: 'Revisar',
    },
    {
      title: 'Casos técnicos',
      description: 'Atendimentos, observações e intervenções da clínica.',
      href: '/clinic/cases',
      icon: BriefcaseBusiness,
      tone: 'purple',
      metricLabel: 'ativos',
      metricValue: snapshot.metrics.openTechnicalCases,
      cta: 'Acompanhar',
    },
    {
      title: 'Indicadores',
      description: 'Sinais de risco, evolução e priorização das empresas.',
      href: '/clinic/indicators',
      icon: Activity,
      tone: 'slate',
      metricLabel: 'implantação',
      metricValue: `${snapshot.metrics.averageImplementation}%`,
      cta: 'Analisar',
    },
  ];
}

export default async function ClinicFollowUpPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) {
    throw new AuthorizationError('A clínica não foi encontrada para este usuário.');
  }

  const snapshot = await loadClinicWorkspaceSnapshot(supabase, {
    clinicId: membership.clinic_id,
    organizationId: membership.organization_id,
  });
  const openHumanRequests = snapshot.metrics.openCareRequests + snapshot.metrics.openComplaints;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Acompanhamento"
        subtitle="Monitoramento clínico de colaboradores, pedidos de ajuda, denúncias, casos técnicos e indicadores."
        userName="Clínica"
        notifications={openHumanRequests + snapshot.metrics.openTechnicalCases}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Colaboradores monitorados"
          value={snapshot.metrics.collaborators.toLocaleString('pt-BR')}
          icon={Users}
          tone="teal"
        />
        <MetricCard
          label="Pedidos de ajuda abertos"
          value={snapshot.metrics.openCareRequests}
          icon={HandHeart}
          tone={snapshot.metrics.openCareRequests ? 'orange' : 'teal'}
        />
        <MetricCard
          label="Denúncias abertas"
          value={snapshot.metrics.openComplaints}
          icon={FileWarning}
          tone={snapshot.metrics.openComplaints ? 'red' : 'blue'}
        />
        <MetricCard
          label="Casos técnicos ativos"
          value={snapshot.metrics.openTechnicalCases}
          icon={AlertTriangle}
          tone={snapshot.metrics.openTechnicalCases ? 'orange' : 'teal'}
        />
      </section>

      <NextActionPanel
        title="O que fazer agora no acompanhamento?"
        subtitle="A clínica prioriza o cuidado humano, depois atualiza casos e indicadores."
        actions={followUpActions(snapshot)}
      />
      <FlowHubGrid hubs={followUpHubs(snapshot)} />
      <ImplementationChecklistPanel implementations={snapshot.implementations} limit={3} />
    </div>
  );
}
