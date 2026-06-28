import Link from 'next/link';
import { Award, BookOpen, CheckCircle2, GraduationCap, ShieldCheck, Users } from 'lucide-react';
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
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('tracks')
      .select('id, program_id, status')
      .eq('company_id', membership.company_id)
      .eq('status', 'active'),
    supabase
      .from('modules')
      .select('id, track_id, status')
      .eq('company_id', membership.company_id)
      .eq('status', 'active'),
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
  const completionRate = employees
    ? Math.min(100, Math.round((certificateRows.length / employees) * 100))
    : 0;
  const certifiedPrograms = new Set(certificateRows.map((item) => item.program_id).filter(Boolean))
    .size;
  const statusData: DonutItem[] = [
    { label: 'Disponíveis', value: programRows.length, color: '#12a36d' },
    { label: 'Com certificados', value: certifiedPrograms, color: '#2f76d2' },
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
        title="Programas Disponíveis"
        subtitle="Acompanhe os programas técnicos publicados pela clínica para sua empresa."
        userName="Empresa"
        notifications={programRows.length}
      />

      <section className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-5 py-4 text-sm text-cyan-950">
        A empresa acompanha, divulga e incentiva a participação dos colaboradores. A criação de
        programas, trilhas, módulos e aulas é responsabilidade técnica da Clínica.
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Programas Disponíveis"
          value={programRows.length}
          icon={BookOpen}
          tone="purple"
          hint="publicados pela clínica"
        />
        <MetricCard
          label="Trilhas Publicadas"
          value={trackRows.length}
          icon={GraduationCap}
          tone="teal"
          hint="conteúdo técnico"
        />
        <MetricCard
          label="Módulos Disponíveis"
          value={moduleRows.length}
          icon={CheckCircle2}
          tone="blue"
          hint="para colaboradores"
        />
        <MetricCard
          label="Participantes Ativos"
          value={(employees || 0).toLocaleString('pt-BR')}
          icon={Users}
          tone="orange"
          hint="colaboradores ativos"
        />
        <MetricCard
          label="Certificados Emitidos"
          value={certificateRows.length}
          icon={Award}
          tone="red"
          hint={`${completionRate}% de cobertura`}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <WorkspacePanel
          title="Status dos Programas"
          footerLabel="Ver relatórios permitidos"
          footerHref="/company/reports"
        >
          {statusData.length ? (
            <DonutChart
              data={statusData}
              centerValue={programRows.length}
              centerLabel="Programas"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhum programa publicado pela clínica para esta empresa." />
          )}
        </WorkspacePanel>
        <WorkspacePanel
          title="Evolução de Programas Disponíveis"
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
          title="Estrutura Técnica Publicada"
          footerLabel="Ver aulas disponíveis"
          footerHref="/company/classes"
        >
          {structureData.length ? (
            <DonutChart
              data={structureData}
              centerValue={programRows.length + trackRows.length + moduleRows.length}
              centerLabel="Itens"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="A estrutura técnica ainda não foi publicada pela clínica." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <WorkspacePanel title="Lista de Programas">
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
                  <th className="px-3 py-3">Publicado em</th>
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
                          {program.description || 'Conteúdo técnico publicado pela clínica'}
                        </p>
                      </td>
                      <td className="px-3 py-3">{programTracks.length}</td>
                      <td className="px-3 py-3">{programModules.length}</td>
                      <td className="px-3 py-3">{employees || 0}</td>
                      <td className="px-3 py-3">
                        <StatusPill label="Disponível" tone="green" />
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
              <EmptyWorkspaceState message="Nenhum programa disponibilizado pela clínica para esta empresa." />
            )}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Ações da Empresa">
            <div className="space-y-2">
              {[
                ['Ver aulas disponíveis', '/company/classes'],
                ['Consultar certificados', '/company/certificates'],
                ['Relatórios permitidos', '/company/reports'],
                ['Solicitar apoio à clínica', '/company/help-requests'],
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
          <WorkspacePanel title="Governança técnica">
            <div className="space-y-3 text-xs text-slate-600">
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Programas são criados e mantidos pela Clínica responsável.
              </p>
              <p>
                A empresa mantém dados organizacionais atualizados e acompanha adesão, certificados
                e indicadores autorizados.
              </p>
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
