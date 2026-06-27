import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError, getErrorResponse } from '../../../../../lib/errors';
import { requirePortalContext } from '../../../../../lib/portal-context';

const helpRequestSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const input = helpRequestSchema.parse(await request.json());
    const { supabase, membership } = await requirePortalContext('employee');
    if (!membership.clinic_id || !membership.company_id || !membership.employee_id) {
      throw new AuthorizationError('Escopo de colaborador incompleto');
    }

    const { error } = await supabase.from('help_requests').insert({
      organization_id: membership.organization_id,
      clinic_id: membership.clinic_id,
      company_id: membership.company_id,
      employee_id: membership.employee_id,
      subject: input.subject,
      description: input.description,
      status: 'open',
    });

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: { saved: true } },
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
