import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createClinicSchema } from '../../../lib/validations/clinic';
import { mapClinic } from '../../../lib/domain-mappers';
import { AuthenticationError, AuthorizationError, getErrorResponse } from '../../../lib/errors';

type Profile = { organization_id: string; role: string };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new AuthenticationError();

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

    const input = createClinicSchema.parse(await request.json());
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        organization_id: profile.organization_id,
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
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('activity_events').insert({
      organization_id: profile.organization_id,
      actor_id: auth.user.id,
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
