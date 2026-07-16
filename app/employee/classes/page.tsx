import { RecordsPage, StatusBadge, formatDate } from '../../../components/portal/records-page';
import { requirePortalContext } from '../../../lib/portal-context';

type LessonRow = {
  module_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};
type ModuleRow = { id: string; track_id: string; title: string };
type TrackRow = { id: string; program_id: string };
type ProgramRow = { id: string; title: string };

type LessonRecord = LessonRow & {
  moduleTitle: string;
  programTitle: string;
};

export default async function EmployeeClassesPage() {
  const { supabase, membership } = await requirePortalContext('employee');
  const [{ data: lessons, error }, { data: modules }, { data: tracks }, { data: programs }] =
    await Promise.all([
      supabase
        .from('lessons')
        .select('module_id, title, description, status, created_at')
        .eq('company_id', membership.company_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('modules')
        .select('id, track_id, title')
        .eq('company_id', membership.company_id)
        .eq('status', 'active'),
      supabase
        .from('tracks')
        .select('id, program_id')
        .eq('company_id', membership.company_id)
        .eq('status', 'active'),
      supabase
        .from('programs')
        .select('id, title')
        .eq('company_id', membership.company_id)
        .eq('status', 'active'),
    ]);

  if (error) throw error;
  const moduleMap = new Map(((modules || []) as ModuleRow[]).map((item) => [item.id, item]));
  const trackMap = new Map(((tracks || []) as TrackRow[]).map((item) => [item.id, item]));
  const programMap = new Map(((programs || []) as ProgramRow[]).map((item) => [item.id, item]));
  const records: LessonRecord[] = ((lessons || []) as LessonRow[]).map((lesson) => {
    const lessonModule = moduleMap.get(lesson.module_id);
    const track = lessonModule ? trackMap.get(lessonModule.track_id) : undefined;
    const program = track ? programMap.get(track.program_id) : undefined;

    return {
      ...lesson,
      moduleTitle: lessonModule?.title || '-',
      programTitle: program?.title || '-',
    };
  });

  return (
    <RecordsPage
      title="Aulas e Modulos"
      subtitle="Conteudos liberados para voce pela clinica e pela empresa."
      records={records}
      emptyMessage="Nenhuma aula liberada para voce ainda."
      columns={[
        { header: 'Aula', render: (row) => row.title },
        { header: 'Modulo', render: (row) => row.moduleTitle },
        { header: 'Programa', render: (row) => row.programTitle },
        { header: 'Descricao', render: (row) => row.description || '-' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Publicado em', render: (row) => formatDate(row.created_at) },
      ]}
    />
  );
}
