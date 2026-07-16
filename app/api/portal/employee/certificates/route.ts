import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorResponse, NotFoundError } from '../../../../../lib/errors';
import { requirePortalContext } from '../../../../../lib/portal-context';
import { createAdminClient } from '../../../../../lib/supabase/admin';

const certificateSchema = z.object({
  programId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const input = certificateSchema.parse(await request.json());
    const { membership } = await requirePortalContext('employee');

    if (!membership.clinic_id || !membership.company_id || !membership.employee_id) {
      throw new NotFoundError('Colaborador');
    }

    const admin = createAdminClient();
    const { data: program, error: programError } = await admin
      .from('programs')
      .select('id, title')
      .eq('id', input.programId)
      .eq('organization_id', membership.organization_id)
      .eq('clinic_id', membership.clinic_id)
      .eq('company_id', membership.company_id)
      .eq('status', 'active')
      .maybeSingle();

    if (programError) throw programError;
    if (!program) throw new NotFoundError('Programa');

    const { data: existing, error: existingError } = await admin
      .from('certificates')
      .select('id, issued_at')
      .eq('employee_id', membership.employee_id)
      .eq('program_id', input.programId)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { success: true, data: { certificate: existing, alreadyIssued: true } },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const { data: certificate, error: certificateError } = await admin
      .from('certificates')
      .insert({
        organization_id: membership.organization_id,
        clinic_id: membership.clinic_id,
        company_id: membership.company_id,
        employee_id: membership.employee_id,
        program_id: input.programId,
        metadata: {
          source: 'employee_self_issue',
          programTitle: program.title,
        },
      })
      .select('id, issued_at')
      .single();

    if (certificateError) throw certificateError;

    return NextResponse.json(
      { success: true, data: { certificate, alreadyIssued: false } },
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
