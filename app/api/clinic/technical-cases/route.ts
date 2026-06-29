import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '@/lib/errors';
import { requirePortalContext } from '@/lib/portal-context';
import { normalizeRole } from '@/lib/rbac';
import { createTechnicalCaseSchema } from '@/lib/validations/technical-case';

async function technicalCaseContext() {
  const context = await requirePortalContext('clinic');
  const role = normalizeRole(context.membership.role);
  if (!['clinic_admin', 'clinic_staff'].includes(String(role)) || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

async function assertCompanyAndEmployee(
  supabase: Awaited<ReturnType<typeof technicalCaseContext>>['supabase'],
  clinicId: string,
  companyId: string,
  employeeId?: string | null
) {
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('clinic_id', clinicId)
    .is('deleted_at', null)
    .maybeSingle();
  if (companyError || !company) throw new NotFoundError('Empresa');

  if (!employeeId) return { companyId: company.id, employeeId: null };

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .eq('company_id', company.id)
    .maybeSingle();
  if (employeeError || !employee) throw new NotFoundError('Colaborador');
  return { companyId: company.id, employeeId: employee.id };
}

export async function GET() {
  try {
    const { supabase, membership } = await technicalCaseContext();
    const { data, error } = await supabase
      .from('technical_cases')
      .select(
        '*, companies(name), employees(full_name, email), technical_case_events(id, event_type, title, description, event_date, created_at)'
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
    const { supabase, user, membership } = await technicalCaseContext();
    const input = createTechnicalCaseSchema.parse(await request.json());
    const scope = await assertCompanyAndEmployee(
      supabase,
      membership.clinic_id as string,
      input.companyId,
      input.employeeId
    );

    const { data, error } = await supabase
      .from('technical_cases')
      .insert({
        organization_id: membership.organization_id,
        clinic_id: membership.clinic_id,
        company_id: scope.companyId,
        employee_id: scope.employeeId,
        title: input.title,
        summary: input.summary || null,
        case_type: input.caseType,
        risk_level: input.riskLevel,
        status: input.status,
        closed_at: input.status === 'closed' ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select('*')
      .single();
    if (error) throw error;

    await supabase.from('technical_case_events').insert({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: scope.companyId,
      case_id: data.id,
      employee_id: scope.employeeId,
      event_type: 'status_change',
      title: 'Caso técnico criado',
      description: input.summary || input.title,
      created_by: user.id,
    });

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'technical_case.created',
      entity_type: 'technical_case',
      entity_id: data.id,
      title: 'Caso técnico criado',
      description: input.title,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
