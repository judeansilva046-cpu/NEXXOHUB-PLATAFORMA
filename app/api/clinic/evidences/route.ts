import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { createEvidenceSchema } from '@/lib/validations/clinic-compliance';

type ClinicContext = Awaited<ReturnType<typeof requirePortalContext>>;

async function evidenceContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

async function assertCompany(context: ClinicContext, companyId: string) {
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
    const context = await evidenceContext();
    const { data: companies, error: companiesError } = await context.supabase
      .from('companies')
      .select('id')
      .eq('clinic_id', context.membership.clinic_id)
      .is('deleted_at', null);
    if (companiesError) throw companiesError;

    const companyIds = (companies || []).map((company) => company.id);
    if (!companyIds.length) return NextResponse.json({ success: true, data: [] });

    const { data, error } = await context.supabase
      .from('evidences')
      .select('*, companies(name)')
      .eq('tenant_id', context.membership.organization_id)
      .in('company_id', companyIds)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).filter(
        (item) => (item.metadata as { archived?: boolean } | null)?.archived !== true
      ),
    });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await evidenceContext();
    const input = createEvidenceSchema.parse(await request.json());
    const companyId = await assertCompany(context, input.companyId);
    const { data, error } = await context.supabase
      .from('evidences')
      .insert({
        tenant_id: context.membership.organization_id,
        company_id: companyId,
        title: input.title,
        description: input.description || null,
        evidence_date: input.evidenceDate || null,
        storage_path: input.storagePath || null,
        metadata: {
          evidenceType: input.evidenceType,
          relatedTo: input.relatedTo,
          archived: false,
        },
        created_by: context.user.id,
      })
      .select('*, companies(name)')
      .single();
    if (error) throw error;

    await context.supabase.from('activity_events').insert({
      organization_id: context.membership.organization_id,
      actor_id: context.user.id,
      event_type: 'evidence.created',
      entity_type: 'evidence',
      entity_id: data.id,
      title: 'Evidência registrada',
      description: input.title,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
