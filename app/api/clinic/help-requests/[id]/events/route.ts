import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorResponse, NotFoundError } from '../../../../../../lib/errors';
import { requirePortalContext } from '../../../../../../lib/portal-context';
import { createAdminClient } from '../../../../../../lib/supabase/admin';

const eventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const input = eventSchema.parse(await request.json());
    const { user, membership } = await requirePortalContext('clinic');
    if (!membership.clinic_id) throw new NotFoundError('Clinica');

    const admin = createAdminClient();
    const { data: target, error: targetError } = await admin
      .from('help_requests')
      .select('id')
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) throw new NotFoundError('Pedido de ajuda');

    const { data, error } = await admin
      .from('activity_events')
      .insert({
        organization_id: membership.organization_id,
        actor_id: user.id,
        event_type: 'help_request.note_added',
        entity_type: 'help_request',
        entity_id: params.id,
        title: input.title,
        description: input.description,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(
      { success: false, error: response.message, code: response.code },
      { status: response.statusCode }
    );
  }
}
