import Link from 'next/link';
import { AlertTriangle, Building2, CheckCircle2, FileWarning, ShieldAlert } from 'lucide-react';
import { StatusActionButtons } from '../../../components/portal/status-action-buttons';
import { DonutChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { createAdminClient } from '../../../lib/supabase/admin';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type ComplaintRow = {
  id: string;
  category: string;
  description: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
  employees: SupabaseRelation<{ full_name: string | null }>;
};
type ActivityEventRow = {
  id: string;
  event_type: string;
  entity_id: string | null;
  title: string;
  description: string | null;
  occurred_at: string;
};

function statusLabel(status: string) {
  if (status === 'received') return 'Recebida';
  if (status === 'reviewing') return 'Em analise';
  if (status === 'closed') return 'Encerrada';
  return status;
}

function statusTone(status: string): 'green' | 'orange' | 'red' | 'slate' {
  if (status === 'received') return 'orange';
  if (status === 'reviewing') return 'red';
  if (status === 'closed') return 'green';
  return 'slate';
}

export default async function ClinicComplaintsPage() {
  const { membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clinica nao encontrada.');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('complaints')
    .select('id, category, description, is_anonymous, status, created_at, companies(name), employees(full_name)')
    .eq('clinic_id', membership.clinic_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const complaints = (data || []) as unknown as ComplaintRow[];
  const complaintIds = complaints.map((complaint) => complaint.id);
  const { data: activityEvents } = complaintIds.length
    ? await admin
        .from('activity_events')
        .select('id, event_type, entity_id, title, description, occurred_at')
        .eq('organization_id', membership.organization_id)
        .eq('entity_type', 'complaint')
        .in('entity_id', complaintIds)
        .order('occurred_at', { ascending: false })
        .limit(8)
    : { data: [] };
  const events = (activityEvents || []) as ActivityEventRow[];
  const received = complaints.filter((complaint) => complaint.status === 'received').length;
  const reviewing = complaints.filter((complaint) => complaint.status === 'reviewing').length;
  const closed = complaints.filter((complaint) => complaint.status === 'closed').length;
  const anonymous = complaints.filter((complaint) => complaint.is_anonymous).length;
  const companies = new Set(
    complaints.map((complaint) => firstRelation(complaint.companies)?.name).filter(Boolean)
  );
  const statusData: DonutItem[] = [
    { label: 'Recebidas', value: received, color: '#f59e0b' },
    { label: 'Em analise', value: reviewing, color: '#ef4444' },
    { label: 'Encerradas', value: closed, color: '#12a36d' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Denuncias"
        subtitle="Triagem tecnica e acompanhamento das denuncias registradas no canal protegido."
        userName="Clinica"
        notifications={received + reviewing}
      />

      <section className="rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 text-sm text-red-950">
        Denuncias anonimas continuam anonimas nesta visao. A Clinica acompanha categoria, empresa,
        status e contexto tecnico para orientar encaminhamentos autorizados.
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Denuncias Totais" value={complaints.length} icon={FileWarning} tone="red" />
        <MetricCard label="Recebidas" value={received} icon={AlertTriangle} tone="orange" />
        <MetricCard label="Anonimas" value={anonymous} icon={ShieldAlert} tone="purple" />
        <MetricCard
          label="Empresas Envolvidas"
          value={companies.size}
          icon={Building2}
          tone="blue"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <WorkspacePanel title="Fila de Denuncias">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Origem</th>
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Categoria</th>
                  <th className="px-3 py-3">Descricao</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Criada em</th>
                  <th className="px-3 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((complaint) => {
                  const employee = firstRelation(complaint.employees);
                  const company = firstRelation(complaint.companies);

                  return (
                    <tr key={complaint.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#071737]">
                          {complaint.is_anonymous
                            ? 'Anonima'
                            : employee?.full_name || 'Identificada'}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {complaint.is_anonymous ? 'Identidade protegida' : 'Canal identificado'}
                        </p>
                      </td>
                      <td className="px-3 py-3">{company?.name || '-'}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {complaint.category}
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-80 truncate text-slate-600">{complaint.description}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill label={statusLabel(complaint.status)} tone={statusTone(complaint.status)} />
                      </td>
                      <td className="px-3 py-3">
                        {new Date(complaint.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-3">
                        <StatusActionButtons
                          url={`/api/clinic/complaints/${complaint.id}`}
                          currentStatus={complaint.status}
                          actions={[
                            { label: 'Analisar', status: 'reviewing', tone: 'blue' },
                            { label: 'Encerrar', status: 'closed', tone: 'green' },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!complaints.length && <EmptyWorkspaceState message="Nenhuma denuncia registrada." />}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Status das Denuncias">
            {statusData.length ? (
              <DonutChart data={statusData} centerValue={complaints.length} centerLabel="Denuncias" height={220} />
            ) : (
              <EmptyWorkspaceState message="Sem denuncias para analisar." />
            )}
          </WorkspacePanel>
          <WorkspacePanel title="Historico Recente">
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">{event.title}</p>
                    <span className="text-[10px] text-slate-500">
                      {new Date(event.occurred_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {event.description || event.event_type}
                  </p>
                </div>
              ))}
              {!events.length && <EmptyWorkspaceState message="Nenhum evento registrado." />}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Acoes Relacionadas">
            <div className="space-y-2">
              <Link href="/clinic/cases" className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-blue-800 hover:bg-blue-50">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Casos tecnicos
                </span>
                <span>&gt;</span>
              </Link>
              <Link href="/clinic/help-requests" className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-blue-800 hover:bg-blue-50">
                <span className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4" /> Pedidos de ajuda
                </span>
                <span>&gt;</span>
              </Link>
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
