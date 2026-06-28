import { WorkspaceSectionPage } from '../../../components/workspace/section-page';

const titles: Record<string, string> = {
  diagnostics: 'Diagnósticos',
  tracks: 'Trilhas e Módulos',
  classes: 'Aulas',
  resources: 'Recursos',
  reports: 'Relatórios',
  indicators: 'Indicadores',
  'action-plans': 'Planos de Ação',
  certificates: 'Certificados',
  employees: 'Colaboradores',
  settings: 'Configurações',
};

export default function ClinicSectionPage({ params }: { params: { section: string } }) {
  const title = titles[params.section] || params.section;
  return (
    <WorkspaceSectionPage
      title={title}
      subtitle={`${title} das empresas atendidas pela clínica.`}
      portalLabel="Portal Clínica"
    />
  );
}
