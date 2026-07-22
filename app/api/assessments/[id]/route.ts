import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { requireAuth, requireAdmin, requireAdminOrManager } from '../../../../lib/api/auth-helpers';
import { updateAssessmentSchema } from '../../../../lib/validations/assessment';
import { serialize } from '../../../../lib/serialize';

type AssessmentData = {
  organization_id?: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !assessment) {
      throw new NotFoundError('Avaliação');
    }

    const assessmentData = assessment as AssessmentData;
    if (profile.organization_id !== assessmentData.organization_id) {
      throw new AuthorizationError();
    }

    return NextResponse.json({
      success: true,
      data: serialize(assessment),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdminOrManager(profile);

    const { data: existing } = await supabase
      .from('assessments')
      .select('organization_id')
      .eq('id', id)
      .single();

    const assessmentData = existing as AssessmentData;
    if (!assessmentData || assessmentData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Avaliação');
    }

    const body = await req.json();
    const validatedData = updateAssessmentSchema.parse(body);

    const updatePayload: Record<string, unknown> = {};
    if (validatedData.title !== undefined) updatePayload.title = validatedData.title;
    if (validatedData.description !== undefined) updatePayload.description = validatedData.description;
    if (validatedData.questions !== undefined) updatePayload.questions = validatedData.questions;
    if (validatedData.status !== undefined) updatePayload.status = validatedData.status;
    if (validatedData.employeeId !== undefined) updatePayload.employee_id = validatedData.employeeId;

    const { data: updated, error } = await supabase
      .from('assessments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update assessment');
    }

    return NextResponse.json({
      success: true,
      data: serialize(updated),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdmin(profile);

    const { data: existing } = await supabase
      .from('assessments')
      .select('organization_id')
      .eq('id', id)
      .single();

    const assessmentData = existing as AssessmentData;
    if (!assessmentData || assessmentData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Avaliação');
    }

    const { error } = await supabase.from('assessments').delete().eq('id', id);

    if (error) {
      throw new Error('Failed to delete assessment');
    }

    return NextResponse.json({
      success: true,
      message: 'Avaliação deletada com sucesso',
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
