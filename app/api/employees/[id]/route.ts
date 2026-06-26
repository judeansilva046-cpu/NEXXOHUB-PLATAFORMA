import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { updateEmployeeSchema } from '../../../../lib/validations/employee';
import { mapEmployee } from '../../../../lib/domain-mappers';
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
      .from('employees')
      .select('*, companies(name)')
      .eq('id', params.id)
      .single();
    if (error || !data) throw new NotFoundError('Colaborador');
    return NextResponse.json({ success: true, data: mapEmployee(data) });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, profile } = await context();
    if (!['admin', 'manager'].includes(profile.role)) throw new AuthorizationError();
    const input = updateEmployeeSchema.parse(await request.json());
    if (input.companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('organization_id')
        .eq('id', input.companyId)
        .single();
      if (!company || company.organization_id !== profile.organization_id) {
        throw new AuthorizationError('Empresa não encontrada');
      }
    }
    const update = {
      ...(input.companyId !== undefined && { company_id: input.companyId }),
      ...(input.fullName !== undefined && { full_name: input.fullName }),
      ...(input.cpf !== undefined && { cpf: input.cpf }),
      ...(input.registration !== undefined && { registration: input.registration }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.admissionDate !== undefined && { admission_date: input.admissionDate }),
      ...(input.status !== undefined && { status: input.status }),
    };
    const { data, error } = await supabase
      .from('employees')
      .update(update)
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select('*, companies(name)')
      .single();
    if (error || !data) throw new NotFoundError('Colaborador');
    await supabase.from('activity_events').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      event_type: 'employee.updated',
      entity_type: 'employee',
      entity_id: data.id,
      title: 'Colaborador atualizado',
      description: data.full_name,
    });
    return NextResponse.json({ success: true, data: mapEmployee(data) });
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
      .from('employees')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select('id, full_name')
      .single();
    if (error || !data) throw new NotFoundError('Colaborador');
    await supabase.from('activity_events').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      event_type: 'employee.deleted',
      entity_type: 'employee',
      entity_id: data.id,
      title: 'Colaborador excluído',
      description: data.full_name,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
