import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import {
  isLearningResource,
  updateLessonSchema,
  updateModuleSchema,
  updateProgramSchema,
  updateTrackSchema,
} from '@/lib/validations/clinic-learning';

type Context = { params: { resource: string; id: string } };

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

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    if (!isLearningResource(params.resource)) throw new NotFoundError('Recurso');
    const { supabase, user, membership } = await learningContext();
    const clinicId = membership.clinic_id as string;
    const payload = await request.json();
    let update: Record<string, unknown>;

    if (params.resource === 'programs') {
      const input = updateProgramSchema.parse(payload);
      update = {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.companyId !== undefined && {
          company_id: await verifyCompany(supabase, clinicId, input.companyId),
        }),
      };
    } else if (params.resource === 'tracks') {
      const input = updateTrackSchema.parse(payload);
      update = {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.position !== undefined && { position: input.position }),
      };
    } else if (params.resource === 'modules') {
      const input = updateModuleSchema.parse(payload);
      update = {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.position !== undefined && { position: input.position }),
      };
    } else {
      const input = updateLessonSchema.parse(payload);
      update = {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.position !== undefined && { position: input.position }),
        ...(input.durationMinutes !== undefined && {
          duration_seconds: input.durationMinutes * 60,
        }),
        ...(input.videoProvider !== undefined && {
          video_provider: input.videoProvider || null,
        }),
        ...(input.videoExternalId !== undefined && {
          video_external_id: input.videoExternalId || null,
        }),
      };
    }

    const { data, error } = await supabase
      .from(params.resource)
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('clinic_id', clinicId)
      .select('*')
      .maybeSingle();
    if (error || !data) throw new NotFoundError('Conteúdo técnico');

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: `${params.resource.slice(0, -1)}.updated`,
      entity_type: params.resource.slice(0, -1),
      entity_id: data.id,
      title: 'Conteúdo técnico atualizado',
      description: data.title,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    if (!isLearningResource(params.resource)) throw new NotFoundError('Recurso');
    const { supabase, user, membership } = await learningContext();
    const { data, error } = await supabase
      .from(params.resource)
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .select('id, title')
      .maybeSingle();
    if (error || !data) throw new NotFoundError('Conteúdo técnico');

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: `${params.resource.slice(0, -1)}.archived`,
      entity_type: params.resource.slice(0, -1),
      entity_id: data.id,
      title: 'Conteúdo técnico arquivado',
      description: data.title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
