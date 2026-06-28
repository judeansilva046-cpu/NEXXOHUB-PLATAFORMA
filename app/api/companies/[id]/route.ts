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
import { requirePortalContext } from '../../../../lib/portal-context';
import { normalizeRole } from '../../../../lib/rbac';

type Context = { params: { id: string } };

async function readContext() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new AuthenticationError();
  return { supabase };
}

async function clinicAdminContext() {
  const context = await requirePortalContext('clinic');
  if (normalizeRole(context.membership.role) !== 'clinic_admin' || !context.membership.clinic_id) {
    throw new AuthorizationError();
  }
  return context;
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { supabase } = await readContext();
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
    const { supabase, user, membership } = await clinicAdminContext();
    const input = updateCompanySchema.parse(await request.json());
    if (input.clinicId && input.clinicId !== membership.clinic_id) {
      throw new AuthorizationError('A clínica informada não pertence ao seu portal.');
    }

    const update = {
      clinic_id: membership.clinic_id,
      updated_by: user.id,
      ...(input.legalName !== undefined && { legal_name: input.legalName }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.cnpj !== undefined && { cnpj: input.cnpj }),
      ...(input.hrResponsible !== undefined && { hr_responsible: input.hrResponsible }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.employeeCount !== undefined && { employee_count: input.employeeCount }),
      ...(input.status !== undefined && {
        status: input.status,
        deleted_at: input.status === 'archived' ? new Date().toISOString() : null,
      }),
    };

    const { data, error } = await supabase
      .from('companies')
      .update(update)
      .eq('id', params.id)
      .eq('organization_id', membership.organization_id)
      .eq('clinic_id', membership.clinic_id)
      .select('*, clinics(name)')
      .single();
    if (error || !data) throw new NotFoundError('Empresa');

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
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
    const { supabase, user, membership } = await clinicAdminContext();
    const { data, error } = await supabase
      .from('companies')
      .update({
        status: 'archived',
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', params.id)
      .eq('organization_id', membership.organization_id)
      .eq('clinic_id', membership.clinic_id)
      .select('id, name')
      .single();
    if (error || !data) throw new NotFoundError('Empresa');

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'company.archived',
      entity_type: 'company',
      entity_id: data.id,
      title: 'Empresa arquivada',
      description: data.name,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
