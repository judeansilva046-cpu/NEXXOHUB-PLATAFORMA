import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError, getErrorResponse } from '../../../../../lib/errors';
import { requirePortalContext } from '../../../../../lib/portal-context';

const checkinSchema = z.object({
  moodScore: z.number().int().min(1).max(5),
  stressScore: z.number().int().min(1).max(5),
  sleepScore: z.number().int().min(1).max(5).optional(),
  comments: z.string().max(2000).optional(),
});

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const input = checkinSchema.parse(await request.json());
    const { supabase, membership } = await requirePortalContext('employee');
    if (!membership.clinic_id || !membership.company_id || !membership.employee_id) {
      throw new AuthorizationError('Escopo de colaborador incompleto');
    }

    const { error } = await supabase.from('weekly_checkins').upsert(
      {
        organization_id: membership.organization_id,
        clinic_id: membership.clinic_id,
        company_id: membership.company_id,
        employee_id: membership.employee_id,
        week_start: getCurrentWeekStart(),
        mood_score: input.moodScore,
        stress_score: input.stressScore,
        sleep_score: input.sleepScore,
        comments: input.comments || null,
      },
      { onConflict: 'employee_id,week_start' }
    );

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
