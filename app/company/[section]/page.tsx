import { WorkspaceSectionPage } from '../../../components/workspace/section-page';

const titles: Record<string, string> = {
  tracks: 'Conteúdos técnicos disponíveis',
  diagnostics: 'Diagnósticos',
  evidences: 'Evidências',
  'nr1-dossier': 'Dossiê NR-1',
  reports: 'Relatórios',
  settings: 'Configurações',
};

export default function CompanySectionPage({ params }: { params: { section: string } }) {
  const title = titles[params.section] || params.section;
  return (
    <WorkspaceSectionPage
      title={title}
      subtitle={`${title} da sua empresa.`}
      portalLabel="Portal Empresa"
    />
  );
}
