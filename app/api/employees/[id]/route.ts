import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { requireAuth, requireAdmin, requireAdminOrManager } from '../../../../lib/api/auth-helpers';
import { updateEmployeeSchema } from '../../../../lib/validations/employee';
import { serialize, toSnakeCase } from '../../../../lib/serialize';

type EmployeeRow = { company_id?: string };
type CompanyOrgRow = { organization_id?: string };

async function verifyEmployeeAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  organizationId: string
) {
  const { data: employee } = await supabase
    .from('employees')
    .select('company_id')
    .eq('id', employeeId)
    .single();

  const employeeData = employee as unknown as EmployeeRow;
  if (!employeeData?.company_id) {
    throw new NotFoundError('Colaborador');
  }

  const { data: company } = await supabase
    .from('companies')
    .select('organization_id')
    .eq('id', employeeData.company_id)
    .single();

  const companyData = company as unknown as CompanyOrgRow;
  if (!companyData || companyData.organization_id !== organizationId) {
    throw new AuthorizationError();
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);

    await verifyEmployeeAccess(supabase, id, profile.organization_id);

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (employeeError || !employee) {
      throw new NotFoundError('Colaborador');
    }

    return NextResponse.json({
      success: true,
      data: serialize(employee),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdminOrManager(profile);

    await verifyEmployeeAccess(supabase, id, profile.organization_id);

    const body = await req.json();
    const validatedData = updateEmployeeSchema.parse(body);
    const dbData = toSnakeCase(validatedData as Record<string, unknown>);

    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update employee');
    }

    return NextResponse.json({
      success: true,
      data: serialize(updatedEmployee),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdmin(profile);

    await verifyEmployeeAccess(supabase, id, profile.organization_id);

    const { error: deleteError } = await supabase.from('employees').delete().eq('id', id);

    if (deleteError) {
      throw new Error('Failed to delete employee');
    }

    return NextResponse.json({
      success: true,
      message: 'Colaborador deletado com sucesso',
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
