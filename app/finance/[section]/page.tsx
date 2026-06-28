import { WorkspaceSectionPage } from '../../../components/workspace/section-page';

const titles: Record<string, string> = {
  subscriptions: 'Assinaturas',
  plans: 'Planos',
  invoices: 'Faturas',
  payments: 'Pagamentos',
  revenue: 'Receitas',
  delinquency: 'Inadimplência',
  reports: 'Relatórios Financeiros',
  'cash-flow': 'Fluxo de Caixa',
  clients: 'Clientes (Clínicas)',
  settings: 'Configurações Financeiras',
};

export default function FinanceSectionPage({ params }: { params: { section: string } }) {
  const title = titles[params.section] || params.section;
  return (
    <WorkspaceSectionPage
      title={title}
      subtitle={`Gestão centralizada de ${title.toLowerCase()}.`}
      portalLabel="Financeiro NexxoHub"
    />
  );
}
