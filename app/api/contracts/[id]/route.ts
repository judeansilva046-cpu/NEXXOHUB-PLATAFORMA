import { NextRequest, NextResponse } from 'next/server';
import { requireApiContext } from '../../../../lib/api-context';
import { AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { contractSchema } from '../../../../lib/validations/contract';

type Context = { params: Promise<{ id: string }> };
const MANAGER_ROLES = ['admin', 'manager'] as const;

async function validateScope(
  supabase: Awaited<ReturnType<typeof requireApiContext>>['supabase'],
  organizationId: string,
  clinicId: string,
  companyId: string
) {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('clinic_id', clinicId)
    .eq('organization_id', organizationId)
    .single();
  if (!data) throw new AuthorizationError();
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { supabase, profile } = await requireApiContext(MANAGER_ROLES);
    const input = contractSchema.parse(await request.json());
    await validateScope(supabase, profile.organization_id, input.clinicId, input.companyId);

    const { data, error } = await supabase
      .from('contracts')
      .update({
        clinic_id: input.clinicId,
        company_id: input.companyId,
        contract_number: input.contractNumber,
        starts_on: input.startsOn,
        ends_on: input.endsOn || null,
        monthly_value: input.monthlyValue,
        covered_employees: input.coveredEmployees,
        status: input.status,
      })
      .eq('id', id)
      .eq('tenant_id', profile.organization_id)
      .select('*, clinics(name), companies(name)')
      .single();

    if (error || !data) throw new NotFoundError('Contrato');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { supabase, profile } = await requireApiContext(['admin']);
    const { data, error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.organization_id)
      .select('id')
      .single();

    if (error || !data) throw new NotFoundError('Contrato');
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
