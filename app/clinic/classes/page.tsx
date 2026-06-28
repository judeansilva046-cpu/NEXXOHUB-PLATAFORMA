import Link from 'next/link';
import { Award, BookOpen, CirclePlay, Clock3, FileText } from 'lucide-react';
import { LearningEditor } from '../../../components/clinic/learning-editor';
import { DonutChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type LessonRow = {
  id: string;
  company_id: string | null;
  module_id: string;
  title: string;
  description: string | null;
  video_provider: string | null;
  video_external_id: string | null;
  duration_seconds: number | null;
  position: number;
  status: string;
  created_at: string;
  companies: SupabaseRelation<{ name: string }>;
};
type ModuleRow = {
  id: string;
  track_id: string;
  title: string;
  description: string | null;
  position: number;
  status: string;
};
type TrackRow = { id: string; program_id: string; title: string; status: string };
type ProgramRow = { id: string; title: string; status: string };

function minutes(seconds: number | null) {
  return seconds ? Math.max(1, Math.round(seconds / 60)) : 0;
}

function statusLabel(status: string) {
  if (status === 'active') return 'Publicada';
  if (status === 'draft') return 'Rascunho';
  return 'Arquivada';
}

function statusTone(status: string): 'green' | 'orange' | 'slate' {
  if (status === 'active') return 'green';
  if (status === 'draft') return 'orange';
  return 'slate';
}

export default async function ClinicClassesPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clínica não encontrada.');

  const { data: companiesData } = await supabase
    .from('companies')
    .select('id')
    .eq('clinic_id', membership.clinic_id)
    .is('deleted_at', null);
  const companyIds = (companiesData || []).map((company) => company.id);

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
        'id, company_id, module_id, title, description, video_provider, video_external_id, duration_seconds, position, status, created_at, companies(name)'
      )
      .eq('clinic_id', membership.clinic_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('modules')
      .select('id, track_id, title, description, position, status')
      .eq('clinic_id', membership.clinic_id)
      .order('position'),
    supabase
      .from('tracks')
      .select('id, program_id, title, status')
      .eq('clinic_id', membership.clinic_id),
    supabase.from('programs').select('id, title, status').eq('clinic_id', membership.clinic_id),
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', membership.clinic_id),
    companyIds.length
      ? supabase
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .in('company_id', companyIds)
          .eq('status', 'active')
      : Promise.resolve({ count: 0 }),
  ]);

  const lessonRows = (lessons || []) as unknown as LessonRow[];
  const moduleRows = (modules || []) as ModuleRow[];
  const trackRows = (tracks || []) as TrackRow[];
  const programRows = (programs || []) as ProgramRow[];
  const published = lessonRows.filter((lesson) => lesson.status === 'active').length;
  const drafts = lessonRows.filter((lesson) => lesson.status === 'draft').length;
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
      label: 'Materiais',
      value: lessonRows.filter((lesson) => !lesson.video_provider).length,
      color: '#8a5bd2',
    },
  ].filter((item) => item.value > 0);
  const statusData: DonutItem[] = [
    { label: 'Publicadas', value: published, color: '#12a36d' },
    { label: 'Rascunhos', value: drafts, color: '#f5a308' },
    {
      label: 'Arquivadas',
      value: lessonRows.filter((lesson) => lesson.status === 'archived').length,
      color: '#ef4444',
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
  const trackOptions = trackRows.map((track) => ({ id: track.id, label: track.title }));
  const moduleOptions = moduleRows.map((moduleRow) => ({
    id: moduleRow.id,
    label: moduleRow.title,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aulas / Módulos"
        subtitle="Crie, organize e publique aulas, módulos e materiais técnicos para empresas clientes."
        userName="Clínica"
        notifications={drafts}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Aulas Publicadas" value={published} icon={CirclePlay} tone="teal" />
        <MetricCard label="Rascunhos" value={drafts} icon={FileText} tone="orange" />
        <MetricCard label="Módulos" value={moduleRows.length} icon={BookOpen} tone="purple" />
        <MetricCard
          label="Tempo Médio por Aula"
          value={`${averageDuration} min`}
          icon={Clock3}
          tone="blue"
        />
        <MetricCard
          label="Certificados Emitidos"
          value={certificates || 0}
          icon={Award}
          tone="red"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <WorkspacePanel title="Status das Aulas">
          {statusData.length ? (
            <DonutChart
              data={statusData}
              centerValue={lessonRows.length}
              centerLabel="Aulas"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhuma aula criada ainda." />
          )}
        </WorkspacePanel>
        <WorkspacePanel title="Tipos de Conteúdo">
          {contentData.length ? (
            <DonutChart
              data={contentData}
              centerValue={lessonRows.length}
              centerLabel="Conteúdos"
              height={210}
            />
          ) : (
            <EmptyWorkspaceState message="Sem conteúdos técnicos cadastrados." />
          )}
        </WorkspacePanel>
        <WorkspacePanel
          title="Módulos Mais Usados"
          footerLabel="Gerenciar trilhas"
          footerHref="/clinic/tracks"
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
            {!moduleRanking.length && (
              <EmptyWorkspaceState message="Nenhum módulo técnico ainda." />
            )}
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
        <WorkspacePanel title="Biblioteca Técnica">
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            <LearningEditor resource="lessons" parentOptions={moduleOptions} />
            <LearningEditor resource="modules" parentOptions={trackOptions} variant="secondary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Aula</th>
                  <th className="px-3 py-3">Empresa</th>
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
                      <td className="px-3 py-3">
                        {firstRelation(lesson.companies)?.name || 'Todas/sem vínculo'}
                      </td>
                      <td className="px-3 py-3">{lessonModule?.title || '—'}</td>
                      <td className="px-3 py-3">{program?.title || '—'}</td>
                      <td className="px-3 py-3">{minutes(lesson.duration_seconds)} min</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          label={statusLabel(lesson.status)}
                          tone={statusTone(lesson.status)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        {new Date(lesson.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <LearningEditor
                          resource="lessons"
                          variant="text"
                          triggerLabel="Editar"
                          initialValues={{
                            id: lesson.id,
                            title: lesson.title,
                            description: lesson.description,
                            status: lesson.status as 'draft' | 'active' | 'archived',
                            position: lesson.position,
                            durationMinutes: minutes(lesson.duration_seconds),
                            videoProvider: lesson.video_provider === 'vimeo' ? 'vimeo' : null,
                            videoExternalId: lesson.video_external_id,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!lessonRows.length && (
              <EmptyWorkspaceState message="Nenhuma aula técnica criada ainda." />
            )}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Ações Técnicas">
            <div className="space-y-2">
              {[
                ['Programas e trilhas', '/clinic/programs'],
                ['Biblioteca de Recursos', '/clinic/resources'],
                ['Certificados', '/clinic/certificates'],
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
          <WorkspacePanel title="Público técnico">
            <p className="text-xs text-slate-600">
              Conteúdo disponível para{' '}
              <strong className="text-[#071737]">{(employees || 0).toLocaleString('pt-BR')}</strong>{' '}
              colaborador(es) ativos nas empresas clientes da clínica.
            </p>
          </WorkspacePanel>
        </div>
      </section>

      <WorkspacePanel title="Módulos Técnicos">
        <div className="mb-4 flex justify-end">
          <LearningEditor resource="modules" parentOptions={trackOptions} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
              <tr>
                <th className="px-3 py-3">Módulo</th>
                <th className="px-3 py-3">Trilha</th>
                <th className="px-3 py-3">Aulas</th>
                <th className="px-3 py-3">Ordem</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moduleRows.map((moduleRow) => (
                <tr key={moduleRow.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#071737]">{moduleRow.title}</p>
                    <p className="mt-1 max-w-96 truncate text-[10px] text-slate-500">
                      {moduleRow.description || 'Sem descrição'}
                    </p>
                  </td>
                  <td className="px-3 py-3">{trackMap.get(moduleRow.track_id)?.title || '—'}</td>
                  <td className="px-3 py-3">
                    {lessonRows.filter((lesson) => lesson.module_id === moduleRow.id).length}
                  </td>
                  <td className="px-3 py-3">{moduleRow.position}</td>
                  <td className="px-3 py-3">
                    <StatusPill
                      label={statusLabel(moduleRow.status)
                        .replace('Publicada', 'Publicado')
                        .replace('Arquivada', 'Arquivado')}
                      tone={statusTone(moduleRow.status)}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <LearningEditor
                      resource="modules"
                      variant="text"
                      triggerLabel="Editar"
                      initialValues={{
                        id: moduleRow.id,
                        title: moduleRow.title,
                        description: moduleRow.description,
                        status: moduleRow.status as 'draft' | 'active' | 'archived',
                        position: moduleRow.position,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!moduleRows.length && <EmptyWorkspaceState message="Nenhum módulo criado ainda." />}
        </div>
      </WorkspacePanel>
    </div>
  );
}
