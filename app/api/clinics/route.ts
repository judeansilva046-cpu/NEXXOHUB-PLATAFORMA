import { NextRequest, NextResponse } from 'next/server';
import { createClinicSchema } from '../../../lib/validations/clinic';
import { mapClinic } from '../../../lib/domain-mappers';
import { getErrorResponse } from '../../../lib/errors';
import { requireNexxoHubRole } from '../../../lib/nexxohub-context';

export async function GET() {
  try {
    const { supabase } = await requireNexxoHubRole([
      'nexxohub_admin',
      'nexxohub_finance',
      'nexxohub_operator',
    ]);

    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapClinic) });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, membership } = await requireNexxoHubRole(['nexxohub_admin']);

    const input = createClinicSchema.parse(await request.json());
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        organization_id: membership.organization_id,
        name: input.name,
        cnpj: input.cnpj,
        responsible_name: input.responsibleName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        specialties: input.specialties
          ? input.specialties
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        status: input.status,
        created_by: user.id,
        updated_by: user.id,
        deleted_at: input.status === 'archived' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'clinic.created',
      entity_type: 'clinic',
      entity_id: data.id,
      title: 'Clínica cadastrada',
      description: input.name,
    });

    return NextResponse.json({ success: true, data: mapClinic(data) }, { status: 201 });
  } catch (error) {
    const result = getErrorResponse(error);
    return NextResponse.json(result, { status: result.statusCode });
  }
}
