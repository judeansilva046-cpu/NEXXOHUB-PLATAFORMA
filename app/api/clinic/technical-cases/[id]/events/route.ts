import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { createTechnicalCaseEventSchema } from '@/lib/validations/technical-case';

type Context = { params: { id: string } };

async function technicalCaseContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, membership } = await technicalCaseContext();
    const input = createTechnicalCaseEventSchema.parse(await request.json());
    const { data: caseRow, error: caseError } = await supabase
      .from('technical_cases')
      .select('id, company_id, employee_id')
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .maybeSingle();
    if (caseError || !caseRow) throw new NotFoundError('Caso técnico');

    const { data, error } = await supabase
      .from('technical_case_events')
      .insert({
        organization_id: membership.organization_id,
        clinic_id: membership.clinic_id,
        company_id: caseRow.company_id,
        case_id: caseRow.id,
        employee_id: caseRow.employee_id,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        event_date: input.eventDate || new Date().toISOString(),
        metadata: input.metadata,
        created_by: user.id,
      })
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
