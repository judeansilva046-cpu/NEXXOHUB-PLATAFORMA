import { Archive, Building2, CalendarCheck, FileCheck2 } from 'lucide-react';
import { EvidenceEditor, type EvidenceValues } from '../../../components/clinic/compliance-editors';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type EvidenceMetadata = {
  evidenceType?: string;
  relatedTo?: string;
  archived?: boolean;
};
type EvidenceRow = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  evidence_date: string | null;
  storage_path: string | null;
  metadata: EvidenceMetadata | null;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
};

const typeLabels: Record<string, string> = {
  document: 'Documento',
  meeting_minutes: 'Ata',
  training_record: 'Treinamento',
  attendance_record: 'Atendimento',
  technical_note: 'Nota técnica',
  photo: 'Foto',
  other: 'Outro',
};
const relationLabels: Record<string, string> = {
  nr1: 'NR-1',
  pgr: 'PGR',
  technical_case: 'Caso técnico',
  action_plan: 'Plano de ação',
  training: 'Treinamento',
  other: 'Outro',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString('pt-BR');
}

export default async function ClinicEvidencesPage() {
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
      .from('evidences')
      .select(
        'id, company_id, title, description, evidence_date, storage_path, metadata, created_at, companies(name)'
      )
      .eq('tenant_id', membership.organization_id)
      .order('created_at', { ascending: false }),
  ]);
  if (error) throw error;

  const companyIds = new Set((companies || []).map((company) => company.id));
  const rows = ((data || []) as unknown as EvidenceRow[]).filter(
    (row) => companyIds.has(row.company_id) && row.metadata?.archived !== true
  );
  const companyOptions = (companies || []).map((company) => ({
    id: company.id,
    label: company.name,
  }));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthCount = rows.filter((row) =>
    (row.evidence_date || row.created_at).startsWith(currentMonth)
  ).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Evidências Técnicas"
        subtitle="Registre a base documental que comprova ações, treinamentos, PGR, NR-1 e acompanhamento técnico."
        userName="Clínica"
        notifications={rows.length}
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Evidências Ativas" value={rows.length} icon={FileCheck2} tone="blue" />
        <MetricCard
          label="Empresas com Evidências"
          value={new Set(rows.map((row) => row.company_id)).size}
          icon={Building2}
          tone="teal"
        />
        <MetricCard
          label="Registradas no Mês"
          value={monthCount}
          icon={CalendarCheck}
          tone="cyan"
        />
        <MetricCard
          label="Com Arquivo"
          value={rows.filter((row) => row.storage_path).length}
          icon={Archive}
          tone="purple"
        />
      </section>
      <WorkspacePanel
        title="Evidências das Empresas"
        action={<EvidenceEditor companies={companyOptions} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
              <tr>
                <th className="px-3 py-3">Evidência</th>
                <th className="px-3 py-3">Empresa</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Vínculo</th>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Arquivo</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const evidenceType = row.metadata?.evidenceType || 'document';
                const relatedTo = row.metadata?.relatedTo || 'nr1';
                return (
                  <tr key={row.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[#071737]">{row.title}</p>
                      <p className="mt-1 max-w-80 truncate text-[10px] text-slate-500">
                        {row.description || 'Sem descrição'}
                      </p>
                    </td>
                    <td className="px-3 py-3">{firstRelation(row.companies)?.name || '—'}</td>
                    <td className="px-3 py-3">
                      <StatusPill label={typeLabels[evidenceType] || evidenceType} tone="blue" />
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill label={relationLabels[relatedTo] || relatedTo} tone="purple" />
                    </td>
                    <td className="px-3 py-3">{formatDate(row.evidence_date || row.created_at)}</td>
                    <td className="max-w-52 truncate px-3 py-3">{row.storage_path || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <EvidenceEditor
                        companies={companyOptions}
                        triggerLabel="Editar"
                        initialValues={{
                          id: row.id,
                          companyId: row.company_id,
                          title: row.title,
                          description: row.description,
                          evidenceDate: row.evidence_date,
                          storagePath: row.storage_path,
                          evidenceType: evidenceType as EvidenceValues['evidenceType'],
                          relatedTo: relatedTo as EvidenceValues['relatedTo'],
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <EmptyWorkspaceState message="Nenhuma evidência técnica registrada ainda." />
          )}
        </div>
      </WorkspacePanel>
    </div>
  );
}
