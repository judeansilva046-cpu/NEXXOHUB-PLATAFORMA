import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError, getErrorResponse } from '../../../../../lib/errors';
import { requirePortalContext } from '../../../../../lib/portal-context';
import { createAdminClient } from '../../../../../lib/supabase/admin';

const updateSchema = z.object({
  status: z.enum(['received', 'reviewing', 'closed']),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const input = updateSchema.parse(await request.json());
    const { membership } = await requirePortalContext('clinic');

    if (!membership.clinic_id) {
      throw new AuthorizationError('Escopo de clinica incompleto');
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('complaints')
      .update({
        status: input.status,
        closed_at: input.status === 'closed' ? new Date().toISOString() : null,
      })
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id);

    if (error) throw error;

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
