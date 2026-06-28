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
import { requirePortalContext } from '../../../../lib/portal-context';
import { normalizeRole } from '../../../../lib/rbac';

type Context = { params: { id: string } };

async function readContext() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new AuthenticationError();
  return { supabase };
}

async function writeContext() {
  const context = await requirePortalContext('company');
  const role = normalizeRole(context.membership.role);
  if (!['company_admin', 'company_hr'].includes(String(role)) || !context.membership.company_id) {
    throw new AuthorizationError();
  }
  return context;
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { supabase } = await readContext();
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
    const { supabase, user, membership } = await writeContext();
    const input = updateEmployeeSchema.parse(await request.json());

    if (input.companyId && input.companyId !== membership.company_id) {
      throw new AuthorizationError('Empresa não encontrada');
    }

    const update = {
      company_id: membership.company_id,
      updated_by: user.id,
      ...(input.fullName !== undefined && { full_name: input.fullName }),
      ...(input.cpf !== undefined && { cpf: input.cpf }),
      ...(input.registration !== undefined && { registration: input.registration }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.admissionDate !== undefined && { admission_date: input.admissionDate }),
      ...(input.status !== undefined && {
        status: input.status,
        deleted_at: input.status === 'archived' ? new Date().toISOString() : null,
      }),
    };

    const { data, error } = await supabase
      .from('employees')
      .update(update)
      .eq('id', params.id)
      .eq('organization_id', membership.organization_id)
      .eq('company_id', membership.company_id)
      .select('*, companies(name)')
      .single();
    if (error || !data) throw new NotFoundError('Colaborador');

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
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
    const { supabase, user, membership } = await writeContext();
    const { data, error } = await supabase
      .from('employees')
      .update({
        status: 'archived',
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', params.id)
      .eq('organization_id', membership.organization_id)
      .eq('company_id', membership.company_id)
      .select('id, full_name')
      .single();
    if (error || !data) throw new NotFoundError('Colaborador');

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'employee.archived',
      entity_type: 'employee',
      entity_id: data.id,
      title: 'Colaborador arquivado',
      description: data.full_name,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
