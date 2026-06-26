import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { updateClinicSchema } from '../../../../lib/validations/clinic';
import { mapClinic } from '../../../../lib/domain-mappers';
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
    const { data, error } = await supabase.from('clinics').select('*').eq('id', params.id).single();
    if (error || !data) throw new NotFoundError('Clínica');
    return NextResponse.json({ success: true, data: mapClinic(data) });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { supabase, user, profile } = await context();
    if (!['admin', 'manager'].includes(profile.role)) throw new AuthorizationError();
    const input = updateClinicSchema.parse(await request.json());
    const update = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.cnpj !== undefined && { cnpj: input.cnpj }),
      ...(input.responsibleName !== undefined && { responsible_name: input.responsibleName }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.specialties !== undefined && {
        specialties: input.specialties
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }),
      ...(input.status !== undefined && { status: input.status }),
    };
    const { data, error } = await supabase
      .from('clinics')
      .update(update)
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single();
    if (error || !data) throw new NotFoundError('Clínica');
    await supabase.from('activity_events').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      event_type: 'clinic.updated',
      entity_type: 'clinic',
      entity_id: data.id,
      title: 'Clínica atualizada',
      description: data.name,
    });
    return NextResponse.json({ success: true, data: mapClinic(data) });
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
      .from('clinics')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select('id, name')
      .single();
    if (error || !data) throw new NotFoundError('Clínica');
    await supabase.from('activity_events').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      event_type: 'clinic.deleted',
      entity_type: 'clinic',
      entity_id: data.id,
      title: 'Clínica excluída',
      description: data.name,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
