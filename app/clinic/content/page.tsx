import {
  Award,
  BookOpen,
  FileChartColumn,
  GraduationCap,
  Layers,
  Library,
  PlayCircle,
} from 'lucide-react';
import {
  FlowHubGrid,
  NextActionPanel,
  type FlowHub,
  type GuidedAction,
} from '../../../components/clinic/guided-workspace';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import { AuthorizationError } from '../../../lib/errors';
import { loadClinicWorkspaceSnapshot } from '../../../lib/clinic-guidance';
import { requirePortalContext } from '../../../lib/portal-context';

function contentActions(
  snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>
): GuidedAction[] {
  return [
    {
      title: snapshot.metrics.activePrograms
        ? 'Atualizar programas ativos'
        : 'Criar primeiro programa',
      description: 'Programas organizam trilhas, módulos e aulas para as empresas atendidas.',
      href: '/clinic/programs',
      cta: 'Abrir programas',
      tone: snapshot.metrics.activePrograms ? 'green' : 'orange',
      icon: GraduationCap,
      meta: `${snapshot.metrics.activePrograms} ativos`,
    },
    {
      title: snapshot.metrics.activeLessons ? 'Revisar aulas publicadas' : 'Publicar aulas',
      description: 'Aulas publicadas alimentam treinamentos, certificados e evidências.',
      href: '/clinic/classes',
      cta: 'Gerenciar aulas',
      tone: snapshot.metrics.activeLessons ? 'blue' : 'orange',
      icon: PlayCircle,
      meta: `${snapshot.metrics.activeLessons} aulas`,
    },
    {
      title: 'Acompanhar certificados',
      description: 'Certificados comprovam conclusão e fortalecem o dossiê NR-1.',
      href: '/clinic/certificates',
      cta: 'Ver certificados',
      tone: 'purple',
      icon: Award,
      meta: `${snapshot.metrics.certificatesIssued}`,
    },
  ];
}

function contentHubs(snapshot: Awaited<ReturnType<typeof loadClinicWorkspaceSnapshot>>): FlowHub[] {
  return [
    {
      title: 'Programas',
      description: 'Estruture campanhas e ações de saúde psicossocial por empresa.',
      href: '/clinic/programs',
      icon: GraduationCap,
      tone: 'green',
      metricLabel: 'ativos',
      metricValue: snapshot.metrics.activePrograms,
      cta: 'Gerenciar',
    },
    {
      title: 'Trilhas e módulos',
      description: 'Organize a jornada de aprendizagem em etapas claras.',
      href: '/clinic/tracks',
      icon: Layers,
      tone: 'blue',
      metricLabel: 'implantação',
      metricValue: `${snapshot.metrics.averageImplementation}%`,
      cta: 'Organizar',
    },
    {
      title: 'Aulas',
      description: 'Publique vídeos, materiais, quizzes e conteúdos de apoio.',
      href: '/clinic/classes',
      icon: BookOpen,
      tone: 'purple',
      metricLabel: 'publicadas',
      metricValue: snapshot.metrics.activeLessons,
      cta: 'Publicar',
    },
    {
      title: 'Recursos',
      description: 'Biblioteca técnica para anexos, documentos e materiais de suporte.',
      href: '/clinic/resources',
      icon: Library,
      tone: 'orange',
      metricLabel: 'empresas',
      metricValue: snapshot.metrics.activeCompanies,
      cta: 'Abrir',
    },
    {
      title: 'Certificados',
      description: 'Comprovação de conclusão dos treinamentos pelos colaboradores.',
      href: '/clinic/certificates',
      icon: Award,
      tone: 'slate',
      metricLabel: 'emitidos',
      metricValue: snapshot.metrics.certificatesIssued,
      cta: 'Consultar',
    },
  ];
}

export default async function ClinicContentPage() {
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
        title="Conteúdos e Treinamentos"
        subtitle="Central da clínica para programas, trilhas, aulas, recursos e certificados."
        userName="Clínica"
        notifications={snapshot.metrics.activePrograms + snapshot.metrics.activeLessons}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Programas ativos"
          value={snapshot.metrics.activePrograms}
          icon={GraduationCap}
          tone="teal"
        />
        <MetricCard
          label="Aulas publicadas"
          value={snapshot.metrics.activeLessons}
          icon={BookOpen}
          tone="blue"
        />
        <MetricCard
          label="Certificados emitidos"
          value={snapshot.metrics.certificatesIssued}
          icon={Award}
          tone="purple"
        />
        <MetricCard
          label="Implantação média"
          value={`${snapshot.metrics.averageImplementation}%`}
          icon={FileChartColumn}
          tone="cyan"
        />
      </section>

      <NextActionPanel
        title="O que fazer agora nos conteúdos?"
        subtitle="Conteúdo bom vira treinamento, certificado e evidência para conformidade."
        actions={contentActions(snapshot)}
      />
      <FlowHubGrid hubs={contentHubs(snapshot)} />
    </div>
  );
}
