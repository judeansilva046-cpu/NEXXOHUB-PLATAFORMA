import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createEmployeeSchema } from '../../../lib/validations/employee';
import { mapEmployee } from '../../../lib/domain-mappers';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '../../../lib/errors';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new AuthenticationError();

    let query = supabase
      .from('employees')
      .select('*, companies(name)')
      .order('created_at', { ascending: false });
    const companyId = request.nextUrl.searchParams.get('companyId');
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapEmployee) });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, membership } = await requirePortalContext('company');
    const role = normalizeRole(membership.role);
    if (!['company_admin', 'company_hr'].includes(String(role)) || !membership.company_id) {
      throw new AuthorizationError();
    }

    const input = createEmployeeSchema.parse(await request.json());
    if (input.companyId !== membership.company_id) {
      throw new AuthorizationError('Empresa não encontrada');
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, organization_id, name')
      .eq('id', membership.company_id)
      .single();
    if (!company || company.organization_id !== membership.organization_id) {
      throw new AuthorizationError('Empresa não encontrada');
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({
        organization_id: membership.organization_id,
        company_id: membership.company_id,
        created_by: user.id,
        updated_by: user.id,
        full_name: input.fullName,
        cpf: input.cpf,
        registration: input.registration,
        position: input.position,
        department: input.department,
        email: input.email,
        phone: input.phone,
        admission_date: input.admissionDate,
        status: input.status,
      })
      .select('*, companies(name)')
      .single();
    if (error) throw error;

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'employee.created',
      entity_type: 'employee',
      entity_id: data.id,
      title: 'Novo colaborador',
      description: `${input.fullName} • ${company.name}`,
    });

    return NextResponse.json({ success: true, data: mapEmployee(data) }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
