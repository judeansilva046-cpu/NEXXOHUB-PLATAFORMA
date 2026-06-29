import { Archive, Building2, FileCheck2, FileClock } from 'lucide-react';
import { DossierEditor } from '../../../components/clinic/compliance-editors';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type DossierRow = {
  id: string;
  company_id: string;
  title: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'generated' | 'archived';
  storage_path: string | null;
  generated_at: string | null;
  companies: SupabaseRelation<{ name: string }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString('pt-BR');
}
function statusLabel(status: DossierRow['status']) {
  return status === 'generated' ? 'Gerado' : status === 'draft' ? 'Rascunho' : 'Arquivado';
}
function statusTone(status: DossierRow['status']): 'green' | 'orange' | 'slate' {
  return status === 'generated' ? 'green' : status === 'draft' ? 'orange' : 'slate';
}

export default async function ClinicNr1DossiersPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clínica não encontrada.');
  const [{ data: companies }, { data, error }] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name')
      .eq('clinic_id', membership.clinic_id)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('nr1_dossiers')
      .select(
        'id, company_id, title, period_start, period_end, status, storage_path, generated_at, companies(name)'
      )
      .eq('clinic_id', membership.clinic_id)
      .order('period_end', { ascending: false }),
  ]);
  if (error) throw error;
  const rows = (data || []) as unknown as DossierRow[];
  const companyOptions = (companies || []).map((company) => ({
    id: company.id,
    label: company.name,
  }));
  const generated = rows.filter((row) => row.status === 'generated').length;
  const drafts = rows.filter((row) => row.status === 'draft').length;
  const archived = rows.filter((row) => row.status === 'archived').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dossiê NR-1"
        subtitle="Gere e mantenha o dossiê auditável das empresas atendidas pela clínica."
        userName="Clínica"
        notifications={drafts}
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Dossiês" value={rows.length} icon={FileCheck2} tone="blue" />
        <MetricCard label="Gerados" value={generated} icon={FileCheck2} tone="teal" />
        <MetricCard label="Rascunhos" value={drafts} icon={FileClock} tone="orange" />
        <MetricCard
          label="Empresas Cobertas"
          value={new Set(rows.map((row) => row.company_id)).size}
          icon={Building2}
          tone="purple"
        />
      </section>
      <WorkspacePanel
        title="Dossiês das Empresas"
        action={<DossierEditor companies={companyOptions} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
              <tr>
                <th className="px-3 py-3">Dossiê</th>
                <th className="px-3 py-3">Empresa</th>
                <th className="px-3 py-3">Período</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Gerado em</th>
                <th className="px-3 py-3">Arquivo</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#071737]">{row.title}</p>
                    {row.status === 'archived' && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <Archive className="h-3 w-3" /> Arquivado para histórico
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">{firstRelation(row.companies)?.name || '—'}</td>
                  <td className="px-3 py-3">
                    {formatDate(row.period_start)} a {formatDate(row.period_end)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill label={statusLabel(row.status)} tone={statusTone(row.status)} />
                  </td>
                  <td className="px-3 py-3">{formatDate(row.generated_at)}</td>
                  <td className="max-w-52 truncate px-3 py-3">{row.storage_path || '—'}</td>
                  <td className="px-3 py-3 text-right">
                    <DossierEditor
                      companies={companyOptions}
                      triggerLabel="Editar"
                      initialValues={{
                        id: row.id,
                        companyId: row.company_id,
                        title: row.title,
                        periodStart: row.period_start,
                        periodEnd: row.period_end,
                        status: row.status,
                        storagePath: row.storage_path,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyWorkspaceState message="Nenhum dossiê NR-1 gerado ainda." />}
        </div>
        {archived > 0 && (
          <p className="mt-3 text-[11px] text-slate-500">
            {archived} dossiê(s) arquivado(s) permanecem no histórico para rastreabilidade.
          </p>
        )}
      </WorkspacePanel>
    </div>
  );
}
