import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createEmployeeSchema } from '../../../lib/validations/employee';
import { mapEmployee } from '../../../lib/domain-mappers';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '../../../lib/errors';

type Profile = { organization_id: string; role: string };

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
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new AuthenticationError();
    const { data: profileData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', auth.user.id)
      .single();
    const profile = profileData as Profile | null;
    if (!profile) throw new AuthenticationError();
    if (!['admin', 'manager'].includes(profile.role)) throw new AuthorizationError();

    const input = createEmployeeSchema.parse(await request.json());
    const { data: company } = await supabase
      .from('companies')
      .select('id, organization_id, name')
      .eq('id', input.companyId)
      .single();
    if (!company || company.organization_id !== profile.organization_id) {
      throw new AuthorizationError('Empresa não encontrada');
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({
        organization_id: profile.organization_id,
        company_id: input.companyId,
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
      organization_id: profile.organization_id,
      actor_id: auth.user.id,
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
