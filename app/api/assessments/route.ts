import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorResponse } from '../../../lib/errors';
import { requireAuth, requireAdminOrManager } from '../../../lib/api/auth-helpers';
import { createAssessmentSchema } from '../../../lib/validations/assessment';
import { serialize } from '../../../lib/serialize';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);

    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch assessments');
    }

    return NextResponse.json({
      success: true,
      data: serialize(assessments),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, profile } = await requireAuth(supabase);
    requireAdminOrManager(profile, 'Apenas administradores ou gerentes podem criar avaliações');

    const body = await req.json();
    const validatedData = createAssessmentSchema.parse(body);

    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert([
        {
          organization_id: profile.organization_id,
          employee_id: validatedData.employeeId || null,
          title: validatedData.title,
          description: validatedData.description,
          questions: validatedData.questions,
          status: validatedData.status,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create assessment');
    }

    return NextResponse.json(
      {
        success: true,
        data: serialize(assessment),
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
