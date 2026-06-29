import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { createPgrSchema } from '@/lib/validations/pgr';

async function pgrContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

export async function GET() {
  try {
    const { supabase, membership } = await pgrContext();
    const { data, error } = await supabase
      .from('pgr_programs')
      .select(
        '*, companies(name), pgr_versions(id, version_number, status, change_summary, created_at, published_at)'
      )
      .eq('clinic_id', membership.clinic_id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, membership } = await pgrContext();
    const input = createPgrSchema.parse(await request.json());
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', input.companyId)
      .eq('clinic_id', membership.clinic_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (companyError || !company) throw new NotFoundError('Empresa');

    const published = input.status === 'published';
    const { data: pgr, error } = await supabase
      .from('pgr_programs')
      .insert({
        organization_id: membership.organization_id,
        clinic_id: membership.clinic_id,
        company_id: company.id,
        title: input.title,
        description: input.description || null,
        period_start: input.periodStart || null,
        period_end: input.periodEnd || null,
        status: input.status,
        current_version: 1,
        published_at: published ? new Date().toISOString() : null,
        published_by: published ? user.id : null,
        created_by: user.id,
      })
      .select('*')
      .single();
    if (error) throw error;

    const { error: versionError } = await supabase.from('pgr_versions').insert({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: company.id,
      pgr_id: pgr.id,
      version_number: 1,
      change_summary: input.changeSummary || 'Versão inicial',
      content: {
        ...input.content,
        title: input.title,
        description: input.description || null,
        periodStart: input.periodStart || null,
        periodEnd: input.periodEnd || null,
      },
      status: published ? 'published' : 'draft',
      created_by: user.id,
      published_by: published ? user.id : null,
      published_at: published ? new Date().toISOString() : null,
    });
    if (versionError) throw versionError;

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'pgr.created',
      entity_type: 'pgr',
      entity_id: pgr.id,
      title: 'PGR criado',
      description: input.title,
    });

    return NextResponse.json({ success: true, data: pgr }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
