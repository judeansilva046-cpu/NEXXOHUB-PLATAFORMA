import Link from 'next/link';
import { Award, BookOpen, CheckCircle2, Clock3, GraduationCap, Layers, Plus } from 'lucide-react';
import { DonutChart, TrendChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type CompanyRow = { id: string; name: string; status: string | null };
type ProgramRow = {
  id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
};
type TrackRow = { id: string; program_id: string; status: string };
type ModuleRow = { id: string; track_id: string; status: string };
type LessonRow = { id: string; module_id: string; status: string };
type CertificateRow = { id: string; program_id: string | null };

function statusLabel(status: string) {
  if (status === 'active') return 'Publicado';
  if (status === 'draft') return 'Rascunho';
  return 'Arquivado';
}

function statusTone(status: string): 'green' | 'orange' | 'slate' {
  if (status === 'active') return 'green';
  if (status === 'draft') return 'orange';
  return 'slate';
}

export default async function ClinicProgramsPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clínica não encontrada.');

  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, name, status')
    .eq('clinic_id', membership.clinic_id)
    .is('deleted_at', null)
    .order('name');

  const companies = (companiesData || []) as CompanyRow[];
  const companyIds = companies.map((company) => company.id);

  const [
    { data: programs },
    { data: tracks },
    { data: modules },
    { data: lessons },
    { data: certificates },
    { count: employees },
  ] = await Promise.all([
    supabase
      .from('programs')
      .select('id, company_id, title, description, status, created_at, companies(name)')
      .eq('clinic_id', membership.clinic_id)
      .order('created_at', { ascending: false }),
    supabase.from('tracks').select('id, program_id, status').eq('clinic_id', membership.clinic_id),
    supabase.from('modules').select('id, track_id, status').eq('clinic_id', membership.clinic_id),
    supabase.from('lessons').select('id, module_id, status').eq('clinic_id', membership.clinic_id),
    supabase.from('certificates').select('id, program_id').eq('clinic_id', membership.clinic_id),
    companyIds.length
      ? supabase
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .in('company_id', companyIds)
          .eq('status', 'active')
      : Promise.resolve({ count: 0 }),
  ]);

  const programRows = (programs || []) as unknown as ProgramRow[];
  const trackRows = (tracks || []) as TrackRow[];
  const moduleRows = (modules || []) as ModuleRow[];
  const lessonRows = (lessons || []) as LessonRow[];
  const certificateRows = (certificates || []) as CertificateRow[];
  const activePrograms = programRows.filter((item) => item.status === 'active').length;
  const draftPrograms = programRows.filter((item) => item.status === 'draft').length;
  const archivedPrograms = programRows.filter((item) => item.status === 'archived').length;
  const activeModules = moduleRows.filter((item) => item.status === 'active').length;
  const activeLessons = lessonRows.filter((item) => item.status === 'active').length;
  const statusData: DonutItem[] = [
    { label: 'Publicados', value: activePrograms, color: '#12a36d' },
    { label: 'Rascunhos', value: draftPrograms, color: '#f5a308' },
    { label: 'Arquivados', value: archivedPrograms, color: '#ef4444' },
  ].filter((item) => item.value > 0);
  const structureData: DonutItem[] = [
    { label: 'Programas', value: programRows.length, color: '#12a36d' },
    { label: 'Trilhas', value: trackRows.length, color: '#2f76d2' },
    { label: 'Módulos', value: moduleRows.length, color: '#8a5bd2' },
    { label: 'Aulas', value: lessonRows.length, color: '#f97316' },
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
        title="Programas Técnicos"
        subtitle="Crie, publique e acompanhe programas de saúde mental e prevenção para empresas clientes."
        userName="Clínica"
        notifications={draftPrograms}
      />

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-sm text-emerald-950">
        A Clínica é o núcleo técnico-operacional: define programas, trilhas, módulos, aulas,
        indicadores, planos de ação, evidências e materiais de apoio. A Empresa apenas consome,
        acompanha e mantém sua base organizacional atualizada.
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Programas Ativos" value={activePrograms} icon={BookOpen} tone="purple" />
        <MetricCard label="Rascunhos Técnicos" value={draftPrograms} icon={Clock3} tone="orange" />
        <MetricCard label="Trilhas" value={trackRows.length} icon={GraduationCap} tone="teal" />
        <MetricCard label="Módulos Publicados" value={activeModules} icon={Layers} tone="blue" />
        <MetricCard
          label="Aulas Publicadas"
          value={activeLessons}
          icon={CheckCircle2}
          tone="cyan"
        />
        <MetricCard
          label="Certificados Emitidos"
          value={certificateRows.length}
          icon={Award}
          tone="red"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <WorkspacePanel
          title="Status dos Programas"
          footerLabel="Ver relatórios"
          footerHref="/clinic/reports"
        >
          {statusData.length ? (
            <DonutChart
              data={statusData}
              centerValue={programRows.length}
              centerLabel="Programas"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhum programa técnico criado ainda." />
          )}
        </WorkspacePanel>
        <WorkspacePanel
          title="Evolução de Programas"
          action={
            <span className="rounded-lg border px-3 py-1.5 text-[10px] text-slate-600">
              Últimos 6 meses⌄
            </span>
          }
          footerLabel="Ver histórico completo"
          footerHref="/clinic/reports"
        >
          <TrendChart data={series} color="#0891b2" height={210} />
        </WorkspacePanel>
        <WorkspacePanel
          title="Estrutura Operacional"
          footerLabel="Gerenciar aulas"
          footerHref="/clinic/classes"
        >
          {structureData.length ? (
            <DonutChart
              data={structureData}
              centerValue={
                programRows.length + trackRows.length + moduleRows.length + lessonRows.length
              }
              centerLabel="Itens"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhuma estrutura técnica cadastrada." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
        <WorkspacePanel title="Lista de Programas Técnicos">
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            <Link
              href="/clinic/programs?new=1"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Novo Programa
            </Link>
            <Link
              href="/clinic/classes?new=1"
              className="flex items-center gap-2 rounded-xl border border-blue-100 px-4 py-2.5 text-xs font-semibold text-blue-700"
            >
              <Plus className="h-4 w-4" /> Nova Aula
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Programa</th>
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Trilhas</th>
                  <th className="px-3 py-3">Módulos</th>
                  <th className="px-3 py-3">Aulas</th>
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
                  const moduleIds = programModules.map((module) => module.id);
                  const programLessons = lessonRows.filter((lesson) =>
                    moduleIds.includes(lesson.module_id)
                  );
                  return (
                    <tr key={program.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#071737]">{program.title}</p>
                        <p className="mt-1 max-w-72 truncate text-[10px] text-slate-500">
                          {program.description || 'Sem descrição'}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {firstRelation(program.companies)?.name || 'Todas/sem vínculo'}
                      </td>
                      <td className="px-3 py-3">{programTracks.length}</td>
                      <td className="px-3 py-3">{programModules.length}</td>
                      <td className="px-3 py-3">{programLessons.length}</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          label={statusLabel(program.status)}
                          tone={statusTone(program.status)}
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
              <EmptyWorkspaceState message="Nenhum programa técnico criado ainda." />
            )}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Ações Técnicas">
            <div className="space-y-2">
              {[
                ['Novo Programa', '/clinic/programs?new=1'],
                ['Nova Trilha', '/clinic/tracks?new=1'],
                ['Nova Aula', '/clinic/classes?new=1'],
                ['Planos de Ação', '/clinic/action-plans'],
                ['Dossiê NR-1', '/clinic/nr1-dossiers'],
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
          <WorkspacePanel title="Escopo atendido">
            <div className="space-y-3 text-xs text-slate-600">
              <p>
                <strong className="text-[#071737]">{companies.length}</strong> empresa(s) cliente(s)
                vinculadas à clínica.
              </p>
              <p>
                <strong className="text-[#071737]">
                  {(employees || 0).toLocaleString('pt-BR')}
                </strong>{' '}
                colaborador(es) ativos acompanhados tecnicamente.
              </p>
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
