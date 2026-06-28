import { NextRequest, NextResponse } from 'next/server';
import { updateClinicSchema } from '../../../../lib/validations/clinic';
import { mapClinic } from '../../../../lib/domain-mappers';
import { NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { requireNexxoHubRole } from '../../../../lib/nexxohub-context';

type Context = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { supabase } = await requireNexxoHubRole([
      'nexxohub_admin',
      'nexxohub_finance',
      'nexxohub_operator',
    ]);
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
    const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
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
      ...(input.status !== undefined && {
        status: input.status,
        deleted_at: input.status === 'archived' ? new Date().toISOString() : null,
      }),
      updated_by: user.id,
    };
    const { data, error } = await supabase
      .from('clinics')
      .update(update)
      .eq('id', params.id)
      .eq('organization_id', membership.organization_id)
      .select()
      .single();
    if (error || !data) throw new NotFoundError('Clínica');
    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
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
    const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);
    const { data, error } = await supabase
      .from('clinics')
      .update({
        status: 'archived',
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', params.id)
      .eq('organization_id', membership.organization_id)
      .select('id, name')
      .single();
    if (error || !data) throw new NotFoundError('Clínica');
    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'clinic.archived',
      entity_type: 'clinic',
      entity_id: data.id,
      title: 'Clínica arquivada',
      description: data.name,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
