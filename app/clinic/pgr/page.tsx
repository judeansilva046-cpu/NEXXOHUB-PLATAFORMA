import { Building2, FileClock, FileText, ShieldCheck } from 'lucide-react';
import { PgrEditor } from '../../../components/clinic/pgr-editor';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type PgrVersion = {
  id: string;
  version_number: number;
  status: string;
  change_summary: string | null;
  created_at: string;
};
type PgrRow = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  status: 'draft' | 'published' | 'archived';
  current_version: number;
  published_at: string | null;
  updated_at: string;
  companies: SupabaseRelation<{ name: string }>;
  pgr_versions: PgrVersion[];
};

export default async function ClinicPgrPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clínica não encontrada.');
  const [{ data: companies }, { data: pgrs, error }] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name')
      .eq('clinic_id', membership.clinic_id)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('pgr_programs')
      .select(
        'id, company_id, title, description, period_start, period_end, status, current_version, published_at, updated_at, companies(name), pgr_versions(id, version_number, status, change_summary, created_at)'
      )
      .eq('clinic_id', membership.clinic_id)
      .order('updated_at', { ascending: false }),
  ]);
  if (error) throw error;
  const rows = (pgrs || []) as unknown as PgrRow[];
  const companyOptions = (companies || []).map((company) => ({
    id: company.id,
    label: company.name,
  }));
  const published = rows.filter((row) => row.status === 'published').length;
  const drafts = rows.filter((row) => row.status === 'draft').length;
  const versions = rows.reduce((total, row) => total + (row.pgr_versions?.length || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="PGR — Gerenciamento de Riscos"
        subtitle="Crie, versione e publique o PGR oficial das empresas clientes."
        userName="Clínica"
        notifications={drafts}
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="PGRs Cadastrados" value={rows.length} icon={FileText} tone="blue" />
        <MetricCard label="Publicados" value={published} icon={ShieldCheck} tone="teal" />
        <MetricCard label="Rascunhos" value={drafts} icon={FileClock} tone="orange" />
        <MetricCard label="Versões Registradas" value={versions} icon={Building2} tone="purple" />
      </section>
      <WorkspacePanel title="PGRs das Empresas">
        <div className="mb-4 flex justify-end">
          <PgrEditor companies={companyOptions} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
              <tr>
                <th className="px-3 py-3">PGR</th>
                <th className="px-3 py-3">Empresa</th>
                <th className="px-3 py-3">Período</th>
                <th className="px-3 py-3">Versão</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Atualizado</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#071737]">{row.title}</p>
                    <p className="mt-1 max-w-72 truncate text-[10px] text-slate-500">
                      {row.description || 'Sem descrição'}
                    </p>
                  </td>
                  <td className="px-3 py-3">{firstRelation(row.companies)?.name || '—'}</td>
                  <td className="px-3 py-3">
                    {row.period_start || '—'} a {row.period_end || '—'}
                  </td>
                  <td className="px-3 py-3">v{row.current_version}</td>
                  <td className="px-3 py-3">
                    <StatusPill
                      label={
                        row.status === 'published'
                          ? 'Publicado'
                          : row.status === 'draft'
                            ? 'Rascunho'
                            : 'Arquivado'
                      }
                      tone={
                        row.status === 'published'
                          ? 'green'
                          : row.status === 'draft'
                            ? 'orange'
                            : 'slate'
                      }
                    />
                  </td>
                  <td className="px-3 py-3">
                    {new Date(row.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <PgrEditor
                      companies={companyOptions}
                      triggerLabel="Editar"
                      initialValues={{
                        id: row.id,
                        companyId: row.company_id,
                        title: row.title,
                        description: row.description,
                        periodStart: row.period_start,
                        periodEnd: row.period_end,
                        status: row.status,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyWorkspaceState message="Nenhum PGR criado ainda." />}
        </div>
      </WorkspacePanel>
    </div>
  );
}
