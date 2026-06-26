import { NextRequest, NextResponse } from 'next/server';
import { requireApiContext } from '../../../lib/api-context';
import { AuthorizationError, getErrorResponse } from '../../../lib/errors';
import { contractSchema } from '../../../lib/validations/contract';

const MANAGER_ROLES = ['admin', 'manager'] as const;

async function validateContractScope(
  supabase: Awaited<ReturnType<typeof requireApiContext>>['supabase'],
  organizationId: string,
  clinicId: string,
  companyId: string
) {
  const { data: company } = await supabase
    .from('companies')
    .select('id, clinic_id, organization_id')
    .eq('id', companyId)
    .eq('clinic_id', clinicId)
    .eq('organization_id', organizationId)
    .single();

  if (!company) {
    throw new AuthorizationError('Clínica e empresa não pertencem ao tenant atual');
  }
}

export async function GET() {
  try {
    const { supabase } = await requireApiContext();
    const { data, error } = await supabase
      .from('contracts')
      .select('*, clinics(name), companies(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireApiContext(MANAGER_ROLES);
    const input = contractSchema.parse(await request.json());
    await validateContractScope(supabase, profile.organization_id, input.clinicId, input.companyId);

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        tenant_id: profile.organization_id,
        clinic_id: input.clinicId,
        company_id: input.companyId,
        contract_number: input.contractNumber,
        starts_on: input.startsOn,
        ends_on: input.endsOn || null,
        monthly_value: input.monthlyValue,
        covered_employees: input.coveredEmployees,
        status: input.status,
        created_by: user.id,
      })
      .select('*, clinics(name), companies(name)')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
