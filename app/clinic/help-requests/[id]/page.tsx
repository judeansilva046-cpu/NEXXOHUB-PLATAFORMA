import Link from 'next/link';
import { ArrowLeft, Building2, Clock3, HandHeart, UserRound } from 'lucide-react';
import { CreateTechnicalCaseButton } from '../../../../components/portal/create-case-button';
import { StatusActionButtons } from '../../../../components/portal/status-action-buttons';
import { TreatmentNoteForm } from '../../../../components/portal/treatment-note-form';
import { MetricCard } from '../../../../components/workspace/metric-card';
import { PageHeader } from '../../../../components/workspace/page-header';
import { StatusPill, WorkspacePanel } from '../../../../components/workspace/panel';
import { NotFoundError } from '../../../../lib/errors';
import { requirePortalContext } from '../../../../lib/portal-context';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { firstRelation, type SupabaseRelation } from '../../../../lib/supabase-relations';

type HelpRequestRow = {
  id: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  closed_at: string | null;
  companies: SupabaseRelation<{ name: string }>;
  employees: SupabaseRelation<{ full_name: string; email: string | null }>;
};
type ActivityEventRow = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  occurred_at: string;
};

function statusLabel(status: string) {
  if (status === 'open') return 'Aberto';
  if (status === 'in_treatment') return 'Em tratamento';
  if (status === 'closed') return 'Encerrado';
  return status;
}

function statusTone(status: string): 'green' | 'orange' | 'blue' | 'slate' {
  if (status === 'open') return 'orange';
  if (status === 'in_treatment') return 'blue';
  if (status === 'closed') return 'green';
  return 'slate';
}

export default async function ClinicHelpRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clinica nao encontrada.');

  const admin = createAdminClient();
  const [{ data: request, error }, { data: activityEvents }] = await Promise.all([
    admin
      .from('help_requests')
      .select(
        'id, subject, description, status, created_at, closed_at, companies(name), employees(full_name, email)'
      )
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .maybeSingle(),
    admin
      .from('activity_events')
      .select('id, event_type, title, description, occurred_at')
      .eq('organization_id', membership.organization_id)
      .eq('entity_type', 'help_request')
      .eq('entity_id', params.id)
      .order('occurred_at', { ascending: false }),
  ]);

  if (error) throw error;
  if (!request) throw new NotFoundError('Pedido de ajuda');

  const row = request as unknown as HelpRequestRow;
  const employee = firstRelation(row.employees);
  const company = firstRelation(row.companies);
  const events = (activityEvents || []) as ActivityEventRow[];

  return (
    <div className="space-y-4">
      <Link
        href="/clinic/help-requests"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para pedidos
      </Link>

      <PageHeader
        title={row.subject}
        subtitle="Detalhamento tecnico do pedido de ajuda e linha do tempo de tratativas."
        userName="Clinica"
        notifications={events.length}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Status" value={statusLabel(row.status)} icon={HandHeart} tone="orange" />
        <MetricCard label="Empresa" value={company?.name || '-'} icon={Building2} tone="blue" />
        <MetricCard
          label="Colaborador"
          value={employee?.full_name || 'Colaborador'}
          icon={UserRound}
          tone="teal"
        />
        <MetricCard label="Eventos" value={events.length} icon={Clock3} tone="purple" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel title="Conteudo do Pedido">
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill label={statusLabel(row.status)} tone={statusTone(row.status)} />
              <span className="text-xs text-slate-500">
                Criado em {new Date(row.created_at).toLocaleString('pt-BR')}
              </span>
              {row.closed_at && (
                <span className="text-xs text-slate-500">
                  Encerrado em {new Date(row.closed_at).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap leading-6">{row.description}</p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
              <p className="font-semibold text-slate-800">Colaborador</p>
              <p className="mt-1">{employee?.full_name || 'Colaborador'}</p>
              <p className="mt-1 text-slate-500">{employee?.email || 'Sem e-mail'}</p>
            </div>
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Atualizar Status">
            <StatusActionButtons
              url={`/api/clinic/help-requests/${row.id}`}
              currentStatus={row.status}
              actions={[
                { label: 'Tratar', status: 'in_treatment', tone: 'blue' },
                { label: 'Encerrar', status: 'closed', tone: 'green' },
              ]}
            />
          </WorkspacePanel>
          <WorkspacePanel title="Caso Tecnico">
            <CreateTechnicalCaseButton url={`/api/clinic/help-requests/${row.id}/technical-case`} />
            <p className="mt-2 text-xs text-slate-500">
              Cria um caso tecnico vinculado a este pedido e move a tratativa para em tratamento.
            </p>
          </WorkspacePanel>
          <WorkspacePanel title="Adicionar Nota Tecnica">
            <TreatmentNoteForm url={`/api/clinic/help-requests/${row.id}/events`} />
          </WorkspacePanel>
          <WorkspacePanel title="Linha do Tempo">
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
              {!events.length && (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                  Nenhum evento registrado ainda.
                </p>
              )}
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
