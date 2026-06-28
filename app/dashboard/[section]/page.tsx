import { WorkspaceSectionPage } from '../../../components/workspace/section-page';

const titles: Record<string, string> = {
  users: 'Usuários',
  plans: 'Planos',
  integrations: 'Integrações',
  settings: 'Configurações',
  logs: 'Logs',
  audit: 'Auditoria',
  security: 'Segurança',
  'white-label': 'White Label',
  licensing: 'Licenciamento',
  backups: 'Backups',
  'feature-flags': 'Feature Flags',
  support: 'Suporte',
};

export default function AdminSectionPage({ params }: { params: { section: string } }) {
  const title = titles[params.section] || params.section;
  return (
    <WorkspaceSectionPage
      title={title}
      subtitle={`Gestão de ${title.toLowerCase()} da plataforma NexxoHub.`}
      portalLabel="NexxoHub Admin"
    />
  );
}
