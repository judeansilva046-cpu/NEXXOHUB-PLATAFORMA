import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, NotFoundError, getErrorResponse } from '../../../../lib/errors';
import { requireAuth, requireAdmin } from '../../../../lib/api/auth-helpers';
import { updateReportSchema } from '../../../../lib/validations/assessment';
import { serialize } from '../../../../lib/serialize';

type ReportData = {
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

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !report) {
      throw new NotFoundError('Relatório');
    }

    const reportData = report as ReportData;
    if (profile.organization_id !== reportData.organization_id) {
      throw new AuthorizationError();
    }

    return NextResponse.json({
      success: true,
      data: serialize(report),
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
    requireAdmin(profile);

    const { data: existing } = await supabase
      .from('reports')
      .select('organization_id')
      .eq('id', id)
      .single();

    const reportData = existing as ReportData;
    if (!reportData || reportData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Relatório');
    }

    const body = await req.json();
    const validatedData = updateReportSchema.parse(body);

    const updatePayload: Record<string, unknown> = {};
    if (validatedData.title !== undefined) updatePayload.title = validatedData.title;
    if (validatedData.description !== undefined) updatePayload.description = validatedData.description;
    if (validatedData.reportData !== undefined) updatePayload.report_data = validatedData.reportData;
    if (validatedData.assessmentId !== undefined) updatePayload.assessment_id = validatedData.assessmentId;

    const { data: updated, error } = await supabase
      .from('reports')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update report');
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
      .from('reports')
      .select('organization_id')
      .eq('id', id)
      .single();

    const reportData = existing as ReportData;
    if (!reportData || reportData.organization_id !== profile.organization_id) {
      throw new NotFoundError('Relatório');
    }

    const { error } = await supabase.from('reports').delete().eq('id', id);

    if (error) {
      throw new Error('Failed to delete report');
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório deletado com sucesso',
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
