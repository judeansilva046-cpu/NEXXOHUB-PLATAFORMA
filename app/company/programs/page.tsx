import Link from 'next/link';
import { Award, BookOpen, CheckCircle2, Clock3, GraduationCap, Plus, Users } from 'lucide-react';
import { DonutChart, TrendChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';

type ProgramRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};
type TrackRow = { id: string; program_id: string; status: string };
type ModuleRow = { id: string; track_id: string; status: string };
type CertificateRow = { id: string; program_id: string | null };

export default async function CompanyProgramsPage() {
  const { supabase, membership } = await requirePortalContext('company');
  if (!membership.company_id) throw new Error('Empresa não encontrada.');

  const [
    { data: programs },
    { data: tracks },
    { data: modules },
    { data: certificates },
    { count: employees },
  ] = await Promise.all([
    supabase
      .from('programs')
      .select('id, title, description, status, created_at')
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tracks')
      .select('id, program_id, status')
      .eq('company_id', membership.company_id),
    supabase.from('modules').select('id, track_id, status').eq('company_id', membership.company_id),
    supabase.from('certificates').select('id, program_id').eq('company_id', membership.company_id),
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)
      .eq('status', 'active'),
  ]);

  const programRows = (programs || []) as ProgramRow[];
  const trackRows = (tracks || []) as TrackRow[];
  const moduleRows = (modules || []) as ModuleRow[];
  const certificateRows = (certificates || []) as CertificateRow[];
  const active = programRows.filter((item) => item.status === 'active').length;
  const drafts = programRows.filter((item) => item.status === 'draft').length;
  const archived = programRows.filter((item) => item.status === 'archived').length;
  const completionRate = employees
    ? Math.min(100, Math.round((certificateRows.length / employees) * 100))
    : 0;
  const statusData: DonutItem[] = [
    { label: 'Ativos', value: active, color: '#12a36d' },
    { label: 'Rascunhos', value: drafts, color: '#f5a308' },
    { label: 'Arquivados', value: archived, color: '#ef4444' },
  ].filter((item) => item.value > 0);
  const structureData: DonutItem[] = [
    { label: 'Programas', value: programRows.length, color: '#12a36d' },
    { label: 'Trilhas', value: trackRows.length, color: '#2f76d2' },
    { label: 'Módulos', value: moduleRows.length, color: '#8a5bd2' },
  ].filter((item) => item.value > 0);
  const series = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    month.setMonth(month.getMonth() - (5 - index));
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
    return {
      label: month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      value: programRows.filter((item) => new Date(item.created_at) <= monthEnd).length,
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Programas"
        subtitle="Gerencie todos os programas de saúde e bem-estar da sua empresa."
        userName="Empresa"
        notifications={active}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Programas Ativos"
          value={active}
          icon={BookOpen}
          tone="purple"
          trend="8%"
        />
        <MetricCard
          label="Programas Publicados"
          value={active}
          icon={CheckCircle2}
          tone="teal"
          trend="20%"
        />
        <MetricCard
          label="Em Preparação"
          value={drafts}
          icon={Clock3}
          tone="orange"
          trend="3%"
          trendDirection="down"
        />
        <MetricCard
          label="Participantes"
          value={(employees || 0).toLocaleString('pt-BR')}
          icon={Users}
          tone="purple"
          trend="15%"
        />
        <MetricCard
          label="Certificados Emitidos"
          value={certificateRows.length}
          icon={Award}
          tone="blue"
          trend="15%"
        />
        <MetricCard
          label="Taxa de Conclusão Média"
          value={`${completionRate}%`}
          icon={GraduationCap}
          tone="red"
          trend="6%"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <WorkspacePanel
          title="Status dos Programas"
          footerLabel="Ver todos os programas"
          footerHref="/company/programs"
        >
          {statusData.length ? (
            <DonutChart
              data={statusData}
              centerValue={programRows.length}
              centerLabel="Total"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhum programa cadastrado." />
          )}
        </WorkspacePanel>
        <WorkspacePanel
          title="Evolução dos Programas"
          action={
            <span className="rounded-lg border px-3 py-1.5 text-[10px] text-slate-600">
              Últimos 6 meses⌄
            </span>
          }
          footerLabel="Ver histórico completo"
          footerHref="/company/reports"
        >
          <TrendChart data={series} color="#6d43f5" height={210} />
        </WorkspacePanel>
        <WorkspacePanel
          title="Estrutura de Conteúdo"
          footerLabel="Ver trilhas e módulos"
          footerHref="/company/tracks"
        >
          {structureData.length ? (
            <DonutChart
              data={structureData}
              centerValue={programRows.length + trackRows.length + moduleRows.length}
              centerLabel="Itens"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhuma estrutura criada." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <WorkspacePanel title="Lista de Programas">
          <div className="mb-4 flex justify-end">
            <Link
              href="/company/programs?new=1"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Novo Programa
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Programa</th>
                  <th className="px-3 py-3">Trilhas</th>
                  <th className="px-3 py-3">Módulos</th>
                  <th className="px-3 py-3">Participantes</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Certificados</th>
                  <th className="px-3 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programRows.map((program) => {
                  const programTracks = trackRows.filter(
                    (track) => track.program_id === program.id
                  );
                  const trackIds = programTracks.map((track) => track.id);
                  const programModules = moduleRows.filter((module) =>
                    trackIds.includes(module.track_id)
                  );
                  return (
                    <tr key={program.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#071737]">{program.title}</p>
                        <p className="mt-1 max-w-72 truncate text-[10px] text-slate-500">
                          {program.description || 'Sem descrição'}
                        </p>
                      </td>
                      <td className="px-3 py-3">{programTracks.length}</td>
                      <td className="px-3 py-3">{programModules.length}</td>
                      <td className="px-3 py-3">{employees || 0}</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          label={
                            program.status === 'active'
                              ? 'Ativo'
                              : program.status === 'draft'
                                ? 'Rascunho'
                                : 'Arquivado'
                          }
                          tone={
                            program.status === 'active'
                              ? 'green'
                              : program.status === 'draft'
                                ? 'orange'
                                : 'slate'
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        {certificateRows.filter((item) => item.program_id === program.id).length}
                      </td>
                      <td className="px-3 py-3">
                        {new Date(program.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!programRows.length && (
              <EmptyWorkspaceState message="Nenhum programa disponível para esta empresa." />
            )}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Ações Rápidas">
            <div className="space-y-2">
              {[
                ['Novo Programa', '/company/programs?new=1'],
                ['Nova Trilha', '/company/tracks'],
                ['Novo Módulo', '/company/classes'],
                ['Gerar Relatório', '/company/reports'],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-blue-800 hover:bg-blue-50"
                >
                  <span>{label}</span>
                  <span>›</span>
                </Link>
              ))}
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
