import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import {
  createLessonSchema,
  createModuleSchema,
  createProgramSchema,
  createTrackSchema,
  isLearningResource,
  type LearningResource,
} from '@/lib/validations/clinic-learning';

type Context = { params: { resource: string } };

async function learningContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

async function verifyCompany(
  supabase: Awaited<ReturnType<typeof learningContext>>['supabase'],
  clinicId: string,
  companyId?: string | null
) {
  if (!companyId) return null;
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('clinic_id', clinicId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) throw new NotFoundError('Empresa');
  return data.id;
}

async function recordActivity({
  supabase,
  organizationId,
  actorId,
  resource,
  entityId,
  title,
}: {
  supabase: Awaited<ReturnType<typeof learningContext>>['supabase'];
  organizationId: string;
  actorId: string;
  resource: LearningResource;
  entityId: string;
  title: string;
}) {
  await supabase.from('activity_events').insert({
    organization_id: organizationId,
    actor_id: actorId,
    event_type: `${resource.slice(0, -1)}.created`,
    entity_type: resource.slice(0, -1),
    entity_id: entityId,
    title: 'Conteúdo técnico criado',
    description: title,
  });
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    if (!isLearningResource(params.resource)) throw new NotFoundError('Recurso');
    const { supabase, membership } = await learningContext();
    const { data, error } = await supabase
      .from(params.resource)
      .select('*')
      .eq('clinic_id', membership.clinic_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    if (!isLearningResource(params.resource)) throw new NotFoundError('Recurso');
    const { supabase, user, membership } = await learningContext();
    const clinicId = membership.clinic_id as string;
    const base = {
      organization_id: membership.organization_id,
      clinic_id: clinicId,
      created_by: user.id,
    };
    const payload = await request.json();
    let insert: Record<string, unknown>;

    if (params.resource === 'programs') {
      const input = createProgramSchema.parse(payload);
      insert = {
        ...base,
        company_id: await verifyCompany(supabase, clinicId, input.companyId),
        title: input.title,
        description: input.description || null,
        status: input.status,
      };
    } else if (params.resource === 'tracks') {
      const input = createTrackSchema.parse(payload);
      const { data: program, error } = await supabase
        .from('programs')
        .select('id, company_id')
        .eq('id', input.programId)
        .eq('clinic_id', clinicId)
        .maybeSingle();
      if (error || !program) throw new NotFoundError('Programa');
      insert = {
        ...base,
        company_id: program.company_id,
        program_id: program.id,
        title: input.title,
        description: input.description || null,
        status: input.status,
        position: input.position,
      };
    } else if (params.resource === 'modules') {
      const input = createModuleSchema.parse(payload);
      const { data: track, error } = await supabase
        .from('tracks')
        .select('id, company_id')
        .eq('id', input.trackId)
        .eq('clinic_id', clinicId)
        .maybeSingle();
      if (error || !track) throw new NotFoundError('Trilha');
      insert = {
        ...base,
        company_id: track.company_id,
        track_id: track.id,
        title: input.title,
        description: input.description || null,
        status: input.status,
        position: input.position,
      };
    } else {
      const input = createLessonSchema.parse(payload);
      const { data: moduleRow, error } = await supabase
        .from('modules')
        .select('id, company_id')
        .eq('id', input.moduleId)
        .eq('clinic_id', clinicId)
        .maybeSingle();
      if (error || !moduleRow) throw new NotFoundError('Módulo');
      insert = {
        ...base,
        company_id: moduleRow.company_id,
        module_id: moduleRow.id,
        title: input.title,
        description: input.description || null,
        status: input.status,
        position: input.position,
        duration_seconds: input.durationMinutes * 60,
        video_provider: input.videoProvider || null,
        video_external_id: input.videoExternalId || null,
      };
    }

    const { data, error } = await supabase
      .from(params.resource)
      .insert(insert)
      .select('*')
      .single();
    if (error) throw error;

    await recordActivity({
      supabase,
      organizationId: membership.organization_id,
      actorId: user.id,
      resource: params.resource,
      entityId: data.id,
      title: data.title,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
