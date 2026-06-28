import { WorkspaceSectionPage } from '../../../components/workspace/section-page';

const titles: Record<string, string> = {
  classes: 'Aulas e Módulos',
  activity: 'Minha Atividade',
  settings: 'Configurações',
};

export default function EmployeeSectionPage({ params }: { params: { section: string } }) {
  const title = titles[params.section] || params.section;
  return (
    <WorkspaceSectionPage
      title={title}
      subtitle={`${title} da sua jornada NexxoHub.`}
      portalLabel="Portal Colaborador"
    />
  );
}
