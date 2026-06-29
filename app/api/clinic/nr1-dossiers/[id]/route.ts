import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { updateDossierSchema } from '@/lib/validations/clinic-compliance';

type Context = { params: { id: string } };

async function dossierContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

async function loadDossier(context: Awaited<ReturnType<typeof dossierContext>>, id: string) {
  const { data, error } = await context.supabase
    .from('nr1_dossiers')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', context.membership.clinic_id)
    .maybeSingle();
  if (error || !data) throw new NotFoundError('Dossiê NR-1');
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const context = await dossierContext();
    await loadDossier(context, params.id);
    const input = updateDossierSchema.parse(await request.json());
    const generated = input.status === 'generated';
    const { data, error } = await context.supabase
      .from('nr1_dossiers')
      .update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.periodStart !== undefined && { period_start: input.periodStart }),
        ...(input.periodEnd !== undefined && { period_end: input.periodEnd }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.storagePath !== undefined && { storage_path: input.storagePath || null }),
        ...(generated && { generated_by: context.user.id, generated_at: new Date().toISOString() }),
      })
      .eq('id', params.id)
      .eq('clinic_id', context.membership.clinic_id)
      .select('*, companies(name)')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const context = await dossierContext();
    await loadDossier(context, params.id);
    const { error } = await context.supabase
      .from('nr1_dossiers')
      .update({ status: 'archived' })
      .eq('id', params.id)
      .eq('clinic_id', context.membership.clinic_id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
