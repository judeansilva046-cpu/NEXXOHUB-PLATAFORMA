import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError, getErrorResponse, NotFoundError } from '../../../../../lib/errors';
import { requirePortalContext } from '../../../../../lib/portal-context';
import { createAdminClient } from '../../../../../lib/supabase/admin';

const updateSchema = z.object({
  status: z.enum(['received', 'reviewing', 'closed']),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const input = updateSchema.parse(await request.json());
    const { user, membership } = await requirePortalContext('clinic');

    if (!membership.clinic_id) {
      throw new AuthorizationError('Escopo de clinica incompleto');
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('complaints')
      .update({
        status: input.status,
        closed_at: input.status === 'closed' ? new Date().toISOString() : null,
      })
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundError('Denuncia');

    await admin.from('activity_events').insert({
      organization_id: membership.organization_id,
      actor_id: user.id,
      event_type: 'complaint.status_updated',
      entity_type: 'complaint',
      entity_id: params.id,
      title: 'Denuncia atualizada',
      description: `Status alterado para ${input.status}.`,
    });

    return NextResponse.json(
      { success: true, data: { saved: true } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(
      { success: false, error: response.message, code: response.code },
      { status: response.statusCode }
    );
  }
}
