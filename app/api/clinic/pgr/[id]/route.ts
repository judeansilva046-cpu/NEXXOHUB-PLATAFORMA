import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { updatePgrSchema } from '@/lib/validations/pgr';

type Context = { params: { id: string } };

async function pgrContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, membership } = await pgrContext();
    const input = updatePgrSchema.parse(await request.json());
    const { data: current, error: currentError } = await supabase
      .from('pgr_programs')
      .select('*')
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .maybeSingle();
    if (currentError || !current) throw new NotFoundError('PGR');

    const nextVersion = current.current_version + 1;
    const nextStatus = input.status || current.status;
    const published = nextStatus === 'published';
    const snapshot = {
      ...(input.content || {}),
      title: input.title ?? current.title,
      description: input.description !== undefined ? input.description : current.description,
      periodStart: input.periodStart !== undefined ? input.periodStart : current.period_start,
      periodEnd: input.periodEnd !== undefined ? input.periodEnd : current.period_end,
    };

    if (published) {
      await supabase
        .from('pgr_versions')
        .update({ status: 'superseded' })
        .eq('pgr_id', current.id)
        .eq('status', 'published');
    }

    const { data: pgr, error } = await supabase
      .from('pgr_programs')
      .update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.periodStart !== undefined && { period_start: input.periodStart || null }),
        ...(input.periodEnd !== undefined && { period_end: input.periodEnd || null }),
        status: nextStatus,
        current_version: nextVersion,
        published_at: published ? new Date().toISOString() : current.published_at,
        published_by: published ? user.id : current.published_by,
      })
      .eq('id', current.id)
      .eq('clinic_id', membership.clinic_id)
      .select('*')
      .single();
    if (error) throw error;

    const { error: versionError } = await supabase.from('pgr_versions').insert({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: current.company_id,
      pgr_id: current.id,
      version_number: nextVersion,
      change_summary: input.changeSummary || 'PGR atualizado',
      content: snapshot,
      status: published ? 'published' : nextStatus === 'archived' ? 'superseded' : 'draft',
      created_by: user.id,
      published_by: published ? user.id : null,
      published_at: published ? new Date().toISOString() : null,
    });
    if (versionError) throw versionError;

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: published ? 'pgr.published' : 'pgr.updated',
      entity_type: 'pgr',
      entity_id: pgr.id,
      title: published ? 'PGR publicado' : 'PGR atualizado',
      description: pgr.title,
    });

    return NextResponse.json({ success: true, data: pgr });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, membership } = await pgrContext();
    const { data, error } = await supabase
      .from('pgr_programs')
      .update({ status: 'archived' })
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .select('id, title')
      .maybeSingle();
    if (error || !data) throw new NotFoundError('PGR');
    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'pgr.archived',
      entity_type: 'pgr',
      entity_id: data.id,
      title: 'PGR arquivado',
      description: data.title,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
