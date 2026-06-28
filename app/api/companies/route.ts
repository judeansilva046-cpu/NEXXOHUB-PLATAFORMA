import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createCompanySchema } from '../../../lib/validations/company';
import { mapCompany } from '../../../lib/domain-mappers';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '../../../lib/errors';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new AuthenticationError();
    const { data, error } = await supabase
      .from('companies')
      .select('*, clinics(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data || []).map(mapCompany) });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, membership } = await requirePortalContext('clinic');
    if (normalizeRole(membership.role) !== 'clinic_admin' || !membership.clinic_id) {
      throw new AuthorizationError();
    }

    const input = createCompanySchema.parse(await request.json());
    if (input.clinicId !== membership.clinic_id) {
      throw new AuthorizationError('A clínica informada não pertence ao seu portal.');
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        organization_id: membership.organization_id,
        clinic_id: membership.clinic_id,
        legal_name: input.legalName,
        name: input.name,
        cnpj: input.cnpj,
        hr_responsible: input.hrResponsible,
        email: input.email,
        phone: input.phone,
        address: input.address,
        employee_count: input.employeeCount,
        status: input.status,
        created_by: user.id,
        updated_by: user.id,
        deleted_at: input.status === 'archived' ? new Date().toISOString() : null,
      })
      .select('*, clinics(name)')
      .single();
    if (error) throw error;

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'company.created',
      entity_type: 'company',
      entity_id: data.id,
      title: 'Empresa cadastrada',
      description: input.name,
    });

    return NextResponse.json({ success: true, data: mapCompany(data) }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
