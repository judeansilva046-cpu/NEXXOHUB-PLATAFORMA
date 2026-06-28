import Link from 'next/link';
import { Award, BookOpen, CirclePlay, Clock3, Plus, Users } from 'lucide-react';
import { DonutChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';

type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_provider: string | null;
  duration_seconds: number | null;
  status: string;
  created_at: string;
};
type ModuleRow = { id: string; track_id: string; title: string; status: string };
type TrackRow = { id: string; program_id: string; title: string };
type ProgramRow = { id: string; title: string };

function minutes(seconds: number | null) {
  return seconds ? Math.max(1, Math.round(seconds / 60)) : 0;
}

export default async function CompanyClassesPage() {
  const { supabase, membership } = await requirePortalContext('company');
  if (!membership.company_id) throw new Error('Empresa não encontrada.');

  const [
    { data: lessons },
    { data: modules },
    { data: tracks },
    { data: programs },
    { count: certificates },
    { count: employees },
  ] = await Promise.all([
    supabase
      .from('lessons')
      .select(
        'id, module_id, title, description, video_provider, duration_seconds, status, created_at'
      )
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('modules')
      .select('id, track_id, title, status')
      .eq('company_id', membership.company_id),
    supabase.from('tracks').select('id, program_id, title').eq('company_id', membership.company_id),
    supabase.from('programs').select('id, title').eq('company_id', membership.company_id),
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', membership.company_id),
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)
      .eq('status', 'active'),
  ]);

  const lessonRows = (lessons || []) as LessonRow[];
  const moduleRows = (modules || []) as ModuleRow[];
  const trackRows = (tracks || []) as TrackRow[];
  const programRows = (programs || []) as ProgramRow[];
  const published = lessonRows.filter((lesson) => lesson.status === 'active').length;
  const averageDuration = lessonRows.length
    ? Math.round(
        lessonRows.reduce((sum, lesson) => sum + minutes(lesson.duration_seconds), 0) /
          lessonRows.length
      )
    : 0;
  const contentData: DonutItem[] = [
    {
      label: 'Vídeos',
      value: lessonRows.filter((lesson) => lesson.video_provider).length,
      color: '#2f76d2',
    },
    {
      label: 'Conteúdos',
      value: lessonRows.filter((lesson) => !lesson.video_provider).length,
      color: '#8a5bd2',
    },
  ].filter((item) => item.value > 0);
  const moduleRanking = moduleRows
    .map((moduleRow) => ({
      moduleRow,
      lessons: lessonRows.filter((lesson) => lesson.module_id === moduleRow.id).length,
    }))
    .sort((a, b) => b.lessons - a.lessons)
    .slice(0, 5);
  const moduleMap = new Map(moduleRows.map((moduleRow) => [moduleRow.id, moduleRow]));
  const trackMap = new Map(trackRows.map((track) => [track.id, track]));
  const programMap = new Map(programRows.map((program) => [program.id, program]));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aulas / Módulos"
        subtitle="Gerencie todas as aulas e módulos disponíveis na plataforma."
        userName="Empresa"
        notifications={published}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Aulas Publicadas"
          value={published}
          icon={CirclePlay}
          tone="teal"
          trend="12%"
        />
        <MetricCard
          label="Módulos"
          value={moduleRows.length}
          icon={BookOpen}
          tone="purple"
          trend="8%"
        />
        <MetricCard
          label="Tempo Médio por Aula"
          value={`${averageDuration} min`}
          icon={Clock3}
          tone="orange"
          trend="5%"
        />
        <MetricCard
          label="Colaboradores Ativos"
          value={(employees || 0).toLocaleString('pt-BR')}
          icon={Users}
          tone="blue"
          trend="15%"
        />
        <MetricCard
          label="Certificados Emitidos"
          value={certificates || 0}
          icon={Award}
          tone="red"
          trend="15%"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_315px]">
        <WorkspacePanel title="Todas as Aulas">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex gap-4 text-xs">
              <span className="border-b-2 border-teal-500 pb-3 font-semibold text-teal-700">
                Todas as Aulas
              </span>
              <span className="text-slate-500">Por Módulo</span>
              <span className="text-slate-500">Por Programa</span>
              <span className="text-slate-500">Rascunhos</span>
            </div>
            <Link
              href="/company/classes?new=1"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Nova Aula
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Aula</th>
                  <th className="px-3 py-3">Módulo</th>
                  <th className="px-3 py-3">Programa</th>
                  <th className="px-3 py-3">Duração</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Criada em</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lessonRows.map((lesson, index) => {
                  const lessonModule = moduleMap.get(lesson.module_id);
                  const track = lessonModule ? trackMap.get(lessonModule.track_id) : undefined;
                  const program = track ? programMap.get(track.program_id) : undefined;
                  return (
                    <tr key={lesson.id}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-12 w-16 items-center justify-center rounded-lg ${index % 2 ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}
                          >
                            <CirclePlay className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-semibold text-[#071737]">{lesson.title}</p>
                            <p className="mt-1 max-w-64 truncate text-[10px] text-slate-500">
                              {lesson.description || 'Sem descrição'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">{lessonModule?.title || '—'}</td>
                      <td className="px-3 py-3">{program?.title || '—'}</td>
                      <td className="px-3 py-3">{minutes(lesson.duration_seconds)} min</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          label={
                            lesson.status === 'active'
                              ? 'Publicada'
                              : lesson.status === 'draft'
                                ? 'Rascunho'
                                : 'Arquivada'
                          }
                          tone={
                            lesson.status === 'active'
                              ? 'green'
                              : lesson.status === 'draft'
                                ? 'orange'
                                : 'slate'
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        {new Date(lesson.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="rounded-lg border px-3 py-1.5 text-blue-700">Ver</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!lessonRows.length && (
              <EmptyWorkspaceState message="Nenhuma aula cadastrada para esta empresa." />
            )}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel
            title="Módulos Mais Acessados"
            footerLabel="Ver todos"
            footerHref="/company/tracks"
          >
            <div className="space-y-4">
              {moduleRanking.map(({ moduleRow, lessons: count }, index) => (
                <div key={moduleRow.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{moduleRow.title}</p>
                    <p className="mt-1 text-[9px] text-slate-500">{count} aula(s)</p>
                  </div>
                  <div className="w-16">
                    <div className="h-1 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${moduleRanking[0]?.lessons ? Math.max(8, (count / moduleRanking[0].lessons) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Tipos de Conteúdo">
            {contentData.length ? (
              <DonutChart
                data={contentData}
                centerValue={lessonRows.length}
                centerLabel="Aulas"
                height={170}
              />
            ) : (
              <EmptyWorkspaceState message="Sem conteúdos cadastrados." />
            )}
          </WorkspacePanel>
          <WorkspacePanel title="Ações Rápidas">
            <div className="space-y-2">
              {[
                ['Nova Aula', '/company/classes?new=1'],
                ['Novo Módulo', '/company/tracks'],
                ['Biblioteca de Conteúdos', '/company/classes'],
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
