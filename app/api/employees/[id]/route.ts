import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { updateEmployeeSchema } from '../../../../lib/validations/employee';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Get employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select(`
        *,
        companies(organization_id)
      `)
      .eq('id', params.id)
      .single();

    if (employeeError || !employee) {
      throw new NotFoundError('Colaborador');
    }

    // Verify user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.organization_id !== (employee as any).companies.organization_id) {
      throw new AuthorizationError();
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Verify user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
      throw new AuthorizationError();
    }

    // Get employee to verify ownership
    const { data: employee } = await supabase
      .from('employees')
      .select(`
        company_id,
        companies(organization_id)
      `)
      .eq('id', params.id)
      .single();

    if (!employee || (employee as any).companies.organization_id !== userProfile.organization_id) {
      throw new NotFoundError('Colaborador');
    }

    const body = await req.json();
    const validatedData = updateEmployeeSchema.parse(body);

    // Update employee
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update employee');
    }

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Verify user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      throw new AuthorizationError();
    }

    // Get employee to verify ownership
    const { data: employee } = await supabase
      .from('employees')
      .select(`
        company_id,
        companies(organization_id)
      `)
      .eq('id', params.id)
      .single();

    if (!employee || (employee as any).companies.organization_id !== userProfile.organization_id) {
      throw new NotFoundError('Colaborador');
    }

    // Delete employee
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', params.id);

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
