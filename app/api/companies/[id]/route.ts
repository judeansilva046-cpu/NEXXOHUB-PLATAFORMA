import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { updateCompanySchema } from '../../../../lib/validations/company';
import { mapCompany } from '../../../../lib/domain-mappers';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  getErrorResponse,
} from '../../../../lib/errors';

type Profile = { organization_id: string; role: string };
type Context = { params: { id: string } };

async function context() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new AuthenticationError();
  const { data } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', auth.user.id)
    .single();
  if (!data) throw new AuthenticationError();
  return { supabase, user: auth.user, profile: data as Profile };
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { supabase } = await context();
    const { data, error } = await supabase
      .from('companies')
      .select('*, clinics(name)')
      .eq('id', params.id)
      .single();
    if (error || !data) throw new NotFoundError('Empresa');
    return NextResponse.json({ success: true, data: mapCompany(data) });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, profile } = await context();
    if (!['admin', 'manager'].includes(profile.role)) throw new AuthorizationError();
    const input = updateCompanySchema.parse(await request.json());
    const update = {
      ...(input.clinicId !== undefined && { clinic_id: input.clinicId }),
      ...(input.legalName !== undefined && { legal_name: input.legalName }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.cnpj !== undefined && { cnpj: input.cnpj }),
      ...(input.hrResponsible !== undefined && { hr_responsible: input.hrResponsible }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.employeeCount !== undefined && { employee_count: input.employeeCount }),
      ...(input.status !== undefined && { status: input.status }),
    };
    const { data, error } = await supabase
      .from('companies')
      .update(update)
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select('*, clinics(name)')
      .single();
    if (error || !data) throw new NotFoundError('Empresa');
    await supabase.from('activity_events').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      event_type: 'company.updated',
      entity_type: 'company',
      entity_id: data.id,
      title: 'Empresa atualizada',
      description: data.name,
    });
    return NextResponse.json({ success: true, data: mapCompany(data) });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, profile } = await context();
    if (profile.role !== 'admin') throw new AuthorizationError();
    const { data, error } = await supabase
      .from('companies')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select('id, name')
      .single();
    if (error || !data) throw new NotFoundError('Empresa');
    await supabase.from('activity_events').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      event_type: 'company.deleted',
      entity_type: 'company',
      entity_id: data.id,
      title: 'Empresa excluída',
      description: data.name,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
