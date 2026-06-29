import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { createDossierSchema } from '@/lib/validations/clinic-compliance';

async function dossierContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

async function assertCompany(
  context: Awaited<ReturnType<typeof dossierContext>>,
  companyId: string
) {
  const { data, error } = await context.supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('clinic_id', context.membership.clinic_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) throw new NotFoundError('Empresa');
  return data.id;
}

export async function GET() {
  try {
    const context = await dossierContext();
    const { data, error } = await context.supabase
      .from('nr1_dossiers')
      .select('*, companies(name)')
      .eq('clinic_id', context.membership.clinic_id)
      .order('period_end', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await dossierContext();
    const input = createDossierSchema.parse(await request.json());
    const companyId = await assertCompany(context, input.companyId);
    const generated = input.status === 'generated';
    const { data, error } = await context.supabase
      .from('nr1_dossiers')
      .insert({
        organization_id: context.membership.organization_id,
        clinic_id: context.membership.clinic_id,
        company_id: companyId,
        title: input.title,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        status: input.status,
        storage_path: input.storagePath || null,
        generated_by: generated ? context.user.id : null,
        generated_at: generated ? new Date().toISOString() : null,
      })
      .select('*, companies(name)')
      .single();
    if (error) throw error;

    await context.supabase.from('activity_events').insert({
      organization_id: context.membership.organization_id,
      actor_id: context.user.id,
      event_type: 'nr1_dossier.created',
      entity_type: 'nr1_dossier',
      entity_id: data.id,
      title: generated ? 'Dossiê NR-1 gerado' : 'Dossiê NR-1 salvo',
      description: input.title,
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
