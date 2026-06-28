import { NextRequest, NextResponse } from 'next/server';
import { requireNexxoHubRole } from '../../../../lib/nexxohub-context';
import { AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { contractSchema } from '../../../../lib/validations/contract';

type Context = { params: Promise<{ id: string }> };

async function validateScope(
  supabase: Awaited<ReturnType<typeof requireNexxoHubRole>>['supabase'],
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
    const { supabase, user, membership } = await requireNexxoHubRole([
      'nexxohub_admin',
      'nexxohub_finance',
    ]);
    const input = contractSchema.parse(await request.json());
    await validateScope(supabase, membership.organization_id, input.clinicId, input.companyId);

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
        updated_by: user.id,
        deleted_at: input.status === 'cancelled' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('tenant_id', membership.organization_id)
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
    const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: 'cancelled',
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('tenant_id', membership.organization_id)
      .select('id')
      .single();

    if (error || !data) throw new NotFoundError('Contrato');
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
