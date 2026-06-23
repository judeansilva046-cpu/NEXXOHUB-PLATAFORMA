import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { updateEmployeeSchema } from '../../../../lib/validations/employee';

type UserProfile = {
  organization_id?: string;
  role?: string;
};

type EmployeeData = {
  companies?: {
    organization_id?: string;
  };
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

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

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;
    const employeeData = employee as unknown as EmployeeData;

    if (!profile || profile.organization_id !== employeeData.companies?.organization_id) {
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
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;

    if (!profile || !profile.role || !['admin', 'manager'].includes(profile.role)) {
      throw new AuthorizationError();
    }

    const { data: employee } = await supabase
      .from('employees')
      .select(`
        company_id,
        companies(organization_id)
      `)
      .eq('id', params.id)
      .single();

    const employeeData = employee as unknown as EmployeeData;

    if (!employeeData || employeeData.companies?.organization_id !== profile.organization_id) {
      throw new NotFoundError('Colaborador');
    }

    const body = await req.json();
    const validatedData = updateEmployeeSchema.parse(body);

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
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = userProfile as unknown as UserProfile;

    if (!profile || profile.role !== 'admin') {
      throw new AuthorizationError();
    }

    const { data: employee } = await supabase
      .from('employees')
      .select(`
        company_id,
        companies(organization_id)
      `)
      .eq('id', params.id)
      .single();

    const employeeData = employee as unknown as EmployeeData;

    if (!employeeData || employeeData.companies?.organization_id !== profile.organization_id) {
      throw new NotFoundError('Colaborador');
    }

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