import {
  AlertTriangle,
  ClipboardCheck,
  FileCheck2,
  FileText,
  ListChecks,
  ShieldCheck,
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

function complianceActions(
  snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>
): GuidedAction[] {
  const pendingPgr = Math.max(0, snapshot.metrics.activeCompanies - snapshot.metrics.publishedPgrs);
  const pendingDossiers = Math.max(
    0,
    snapshot.metrics.activeCompanies - snapshot.metrics.generatedDossiers
  );

  return [
    {
      title: pendingPgr ? 'Publicar PGR pendente' : 'Revisar PGRs publicados',
      description: pendingPgr
        ? `${pendingPgr} empresa(s) ainda precisam de PGR publicado.`
        : 'Todos os PGRs registrados estão em dia para as empresas ativas.',
      href: '/clinic/pgr',
      cta: 'Abrir PGR',
      tone: pendingPgr ? 'orange' : 'green',
      icon: FileText,
      meta: `${snapshot.metrics.publishedPgrs}/${snapshot.metrics.activeCompanies}`,
    },
    {
      title: 'Conferir planos de ação',
      description: 'Transforme riscos encontrados em ações preventivas e corretivas rastreáveis.',
      href: '/clinic/action-plans',
      cta: 'Ver planos',
      tone: 'blue',
      icon: ListChecks,
      meta: 'NR-1',
    },
    {
      title: pendingDossiers ? 'Gerar dossiês NR-1' : 'Auditar dossiês',
      description: pendingDossiers
        ? `${pendingDossiers} empresa(s) ainda precisam de dossiê NR-1 gerado.`
        : 'Os dossiês gerados podem ser revisados e exportados para auditoria.',
      href: '/clinic/nr1-dossiers',
      cta: 'Abrir dossiês',
      tone: pendingDossiers ? 'orange' : 'green',
      icon: FileCheck2,
      meta: `${snapshot.metrics.generatedDossiers}`,
    },
  ];
}

function complianceHubs(
  snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>
): FlowHub[] {
  return [
    {
      title: 'Diagnósticos',
      description: 'Avaliações psicossociais que alimentam indicadores e planos.',
      href: '/clinic/diagnostics',
      icon: ClipboardCheck,
      tone: 'blue',
      metricLabel: 'base',
      metricValue: snapshot.metrics.collaborators,
      cta: 'Abrir',
    },
    {
      title: 'PGR',
      description: 'Criação, versionamento e publicação do programa de riscos.',
      href: '/clinic/pgr',
      icon: FileText,
      tone: 'green',
      metricLabel: 'publicados',
      metricValue: snapshot.metrics.publishedPgrs,
      cta: 'Gerenciar',
    },
    {
      title: 'Planos de ação',
      description: 'Ações corretivas/preventivas vinculadas aos riscos mapeados.',
      href: '/clinic/action-plans',
      icon: ListChecks,
      tone: 'orange',
      metricLabel: 'empresas',
      metricValue: snapshot.metrics.activeCompanies,
      cta: 'Acompanhar',
    },
    {
      title: 'Evidências',
      description: 'Documentos, registros e materiais que comprovam execução.',
      href: '/clinic/evidences',
      icon: ShieldCheck,
      tone: 'purple',
      metricLabel: 'implantação',
      metricValue: `${snapshot.metrics.averageImplementation}%`,
      cta: 'Conferir',
    },
    {
      title: 'Dossiê NR-1',
      description: 'Pacote auditável consolidado por empresa e período.',
      href: '/clinic/nr1-dossiers',
      icon: FileCheck2,
      tone: 'slate',
      metricLabel: 'gerados',
      metricValue: snapshot.metrics.generatedDossiers,
      cta: 'Gerar',
    },
  ];
}

export default async function ClinicCompliancePage() {
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
        title="Conformidade NR-1/PGR"
        subtitle="Tudo que a clínica precisa para diagnosticar, registrar, evidenciar e auditar a operação NR-1."
        userName="Clínica"
        notifications={snapshot.metrics.pendingImplementations}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Empresas ativas"
          value={snapshot.metrics.activeCompanies}
          icon={ShieldCheck}
          tone="teal"
        />
        <MetricCard
          label="PGRs publicados"
          value={snapshot.metrics.publishedPgrs}
          icon={FileText}
          tone="blue"
        />
        <MetricCard
          label="Dossiês NR-1"
          value={snapshot.metrics.generatedDossiers}
          icon={FileCheck2}
          tone="purple"
        />
        <MetricCard
          label="Pendências de implantação"
          value={snapshot.metrics.pendingImplementations}
          icon={AlertTriangle}
          tone={snapshot.metrics.pendingImplementations ? 'orange' : 'teal'}
        />
      </section>

      <NextActionPanel
        title="O que fazer agora na conformidade?"
        subtitle="A sequência recomendada é: diagnóstico → PGR → plano de ação → evidências → dossiê."
        actions={complianceActions(snapshot)}
      />
      <FlowHubGrid hubs={complianceHubs(snapshot)} />
      <ImplementationChecklistPanel implementations={snapshot.implementations} limit={3} />
    </div>
  );
}
