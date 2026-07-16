import Link from 'next/link';
import { Building2, CheckCircle2, Clock3, HandHeart, Users } from 'lucide-react';
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

type HelpRequestRow = {
  id: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
  employees: SupabaseRelation<{ full_name: string; email: string | null }>;
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

export default async function ClinicHelpRequestsPage() {
  const { membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clinica nao encontrada.');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('help_requests')
    .select('id, subject, description, status, created_at, companies(name), employees(full_name, email)')
    .eq('clinic_id', membership.clinic_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const requests = (data || []) as unknown as HelpRequestRow[];
  const open = requests.filter((request) => request.status === 'open').length;
  const inTreatment = requests.filter((request) => request.status === 'in_treatment').length;
  const closed = requests.filter((request) => request.status === 'closed').length;
  const companies = new Set(
    requests.map((request) => firstRelation(request.companies)?.name).filter(Boolean)
  );
  const statusData: DonutItem[] = [
    { label: 'Abertos', value: open, color: '#f59e0b' },
    { label: 'Em tratamento', value: inTreatment, color: '#2f76d2' },
    { label: 'Encerrados', value: closed, color: '#12a36d' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pedidos de Ajuda"
        subtitle="Triagem tecnica dos pedidos identificados enviados pelos colaboradores."
        userName="Clinica"
        notifications={open + inTreatment}
      />

      <section className="rounded-2xl border border-orange-100 bg-orange-50/70 px-5 py-4 text-sm text-orange-950">
        A Clinica acompanha pedidos de ajuda para apoiar RH e governanca na priorizacao de casos
        sensiveis, mantendo a tratativa operacional no fluxo autorizado da empresa.
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pedidos Totais" value={requests.length} icon={HandHeart} tone="orange" />
        <MetricCard label="Abertos" value={open} icon={Clock3} tone="red" />
        <MetricCard
          label="Em Tratamento"
          value={inTreatment}
          icon={Users}
          tone="blue"
        />
        <MetricCard
          label="Empresas Envolvidas"
          value={companies.size}
          icon={Building2}
          tone="teal"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <WorkspacePanel title="Fila de Pedidos">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Colaborador</th>
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Assunto</th>
                  <th className="px-3 py-3">Descricao</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => {
                  const employee = firstRelation(request.employees);
                  const company = firstRelation(request.companies);

                  return (
                    <tr key={request.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#071737]">
                          {employee?.full_name || 'Colaborador'}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {employee?.email || 'Sem e-mail'}
                        </p>
                      </td>
                      <td className="px-3 py-3">{company?.name || '-'}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{request.subject}</td>
                      <td className="px-3 py-3">
                        <p className="max-w-80 truncate text-slate-600">{request.description}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill label={statusLabel(request.status)} tone={statusTone(request.status)} />
                      </td>
                      <td className="px-3 py-3">
                        {new Date(request.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!requests.length && <EmptyWorkspaceState message="Nenhum pedido de ajuda registrado." />}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Status dos Pedidos">
            {statusData.length ? (
              <DonutChart data={statusData} centerValue={requests.length} centerLabel="Pedidos" height={220} />
            ) : (
              <EmptyWorkspaceState message="Sem pedidos para analisar." />
            )}
          </WorkspacePanel>
          <WorkspacePanel title="Acoes Relacionadas">
            <div className="space-y-2">
              <Link href="/clinic/cases" className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-blue-800 hover:bg-blue-50">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Casos tecnicos
                </span>
                <span>&gt;</span>
              </Link>
              <Link href="/clinic/complaints" className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-blue-800 hover:bg-blue-50">
                <span className="flex items-center gap-2">
                  <HandHeart className="h-4 w-4" /> Denuncias
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
