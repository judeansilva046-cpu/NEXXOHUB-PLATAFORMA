import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '@/lib/errors';
import { createEmployeeSchema } from '@/lib/validations/employee';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      throw new AuthenticationError();
    }

    let query = supabase
      .from('employees')
      .select(`
        *,
        companies(organization_id)
      `)
      .eq('companies.organization_id', userProfile.organization_id);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: employees, error: employeesError } = await query.order('created_at', { ascending: false });

    if (employeesError) {
      throw new Error('Failed to fetch employees');
    }

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Get user's organization and check if manager or admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      throw new AuthenticationError();
    }

    if (!['admin', 'manager'].includes(userProfile.role)) {
      throw new AuthorizationError('Apenas administradores ou gerentes podem criar colaboradores');
    }

    const body = await req.json();
    const { companyId, ...employeeData } = body;

    // Verify company belongs to user's organization
    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', companyId)
      .single();

    if (!company || company.organization_id !== userProfile.organization_id) {
      throw new AuthorizationError('Empresa não encontrada');
    }

    const validatedData = createEmployeeSchema.parse(employeeData);

    // Create employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert([
        {
          company_id: companyId,
          ...validatedData,
        },
      ])
      .select()
      .single();

    if (employeeError) {
      throw new Error('Failed to create employee');
    }

    return NextResponse.json(
      {
        success: true,
        data: employee,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
