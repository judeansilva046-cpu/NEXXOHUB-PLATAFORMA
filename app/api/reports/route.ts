import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorResponse } from '../../../lib/errors';
import { requireAuth, requireAdminOrManager } from '../../../lib/api/auth-helpers';
import { createReportSchema } from '../../../lib/validations/assessment';
import { serialize } from '../../../lib/serialize';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch reports');
    }

    return NextResponse.json({
      success: true,
      data: serialize(reports),
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
    requireAdminOrManager(profile, 'Apenas administradores ou gerentes podem criar relatórios');

    const body = await req.json();
    const validatedData = createReportSchema.parse(body);

    const { data: report, error } = await supabase
      .from('reports')
      .insert([
        {
          organization_id: profile.organization_id,
          assessment_id: validatedData.assessmentId || null,
          title: validatedData.title,
          description: validatedData.description,
          report_data: validatedData.reportData || {},
          generated_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create report');
    }

    return NextResponse.json(
      {
        success: true,
        data: serialize(report),
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
