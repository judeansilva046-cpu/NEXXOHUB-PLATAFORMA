import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { updateEvidenceSchema } from '@/lib/validations/clinic-compliance';

type Context = { params: { id: string } };
type Metadata = Record<string, unknown> & {
  evidenceType?: string;
  relatedTo?: string;
  archived?: boolean;
};

async function evidenceContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

async function loadEvidence(context: Awaited<ReturnType<typeof evidenceContext>>, id: string) {
  const { data, error } = await context.supabase
    .from('evidences')
    .select('*, companies!inner(id, clinic_id)')
    .eq('id', id)
    .eq('tenant_id', context.membership.organization_id)
    .eq('companies.clinic_id', context.membership.clinic_id)
    .maybeSingle();
  if (error || !data) throw new NotFoundError('Evidência');
  return data;
}

async function assertCompany(
  context: Awaited<ReturnType<typeof evidenceContext>>,
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

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const context = await evidenceContext();
    const current = await loadEvidence(context, params.id);
    const input = updateEvidenceSchema.parse(await request.json());
    const metadata = {
      ...((current.metadata as Metadata | null) || {}),
      ...(input.evidenceType !== undefined && { evidenceType: input.evidenceType }),
      ...(input.relatedTo !== undefined && { relatedTo: input.relatedTo }),
    };
    const companyId =
      input.companyId !== undefined ? await assertCompany(context, input.companyId) : undefined;

    const { data, error } = await context.supabase
      .from('evidences')
      .update({
        ...(companyId !== undefined && { company_id: companyId }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.evidenceDate !== undefined && { evidence_date: input.evidenceDate || null }),
        ...(input.storagePath !== undefined && { storage_path: input.storagePath || null }),
        metadata,
      })
      .eq('id', params.id)
      .eq('tenant_id', context.membership.organization_id)
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
    const context = await evidenceContext();
    const current = await loadEvidence(context, params.id);
    const metadata = {
      ...((current.metadata as Metadata | null) || {}),
      archived: true,
      archivedAt: new Date().toISOString(),
      archivedBy: context.user.id,
    };
    const { error } = await context.supabase
      .from('evidences')
      .update({ metadata })
      .eq('id', params.id)
      .eq('tenant_id', context.membership.organization_id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
