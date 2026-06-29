import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { updateTechnicalCaseSchema } from '@/lib/validations/technical-case';

type Context = { params: { id: string } };

async function technicalCaseContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, membership } = await technicalCaseContext();
    const input = updateTechnicalCaseSchema.parse(await request.json());
    const { data, error } = await supabase
      .from('technical_cases')
      .update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.summary !== undefined && { summary: input.summary || null }),
        ...(input.caseType !== undefined && { case_type: input.caseType }),
        ...(input.riskLevel !== undefined && { risk_level: input.riskLevel }),
        ...(input.status !== undefined && {
          status: input.status,
          closed_at: input.status === 'closed' ? new Date().toISOString() : null,
        }),
      })
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .select('*')
      .maybeSingle();
    if (error || !data) throw new NotFoundError('Caso técnico');

    await supabase.from('technical_case_events').insert({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: data.company_id,
      case_id: data.id,
      employee_id: data.employee_id,
      event_type: 'status_change',
      title: 'Caso técnico atualizado',
      description: input.status ? `Status: ${input.status}` : input.title || data.title,
      created_by: user.id,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, membership } = await technicalCaseContext();
    const { data, error } = await supabase
      .from('technical_cases')
      .update({ status: 'archived' })
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .select('*')
      .maybeSingle();
    if (error || !data) throw new NotFoundError('Caso técnico');

    await supabase.from('technical_case_events').insert({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: data.company_id,
      case_id: data.id,
      employee_id: data.employee_id,
      event_type: 'status_change',
      title: 'Caso técnico arquivado',
      description: data.title,
      created_by: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
