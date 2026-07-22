import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, getErrorResponse } from '../../../lib/errors';
import { requireAuth, requireAdminOrManager } from '../../../lib/api/auth-helpers';
import { createEmployeeSchema } from '../../../lib/validations/employee';
import { serialize, toSnakeCase } from '../../../lib/serialize';

type CompanyRow = { id: string };
type CompanyOrgRow = { organization_id?: string };

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    const companyId = req.nextUrl.searchParams.get('companyId');

    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .eq('organization_id', profile.organization_id);

    if (companiesError) {
      throw new Error('Failed to fetch companies');
    }

    const companyIds = ((companies || []) as unknown as CompanyRow[]).map((c) => c.id);

    if (companyIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    let query = supabase.from('employees').select('*').in('company_id', companyIds);

    if (companyId) {
      if (!companyIds.includes(companyId)) {
        throw new AuthorizationError('Empresa não encontrada');
      }
      query = query.eq('company_id', companyId);
    }

    const { data: employees, error: employeesError } = await query.order('created_at', {
      ascending: false,
    });

    if (employeesError) {
      throw new Error('Failed to fetch employees');
    }

    return NextResponse.json({
      success: true,
      data: serialize(employees),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdminOrManager(profile, 'Apenas administradores ou gerentes podem criar colaboradores');

    const body = await req.json();
    const { companyId, ...employeeData } = body;

    const { data: company } = await supabase
      .from('companies')
      .select('organization_id')
      .eq('id', companyId)
      .single();

    const companyData = company as unknown as CompanyOrgRow;

    if (!companyData || companyData.organization_id !== profile.organization_id) {
      throw new AuthorizationError('Empresa não encontrada');
    }

    const validatedData = createEmployeeSchema.parse(employeeData);
    const dbData = toSnakeCase(validatedData as Record<string, unknown>);

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert([
        {
          company_id: companyId,
          ...dbData,
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
        data: serialize(employee),
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
