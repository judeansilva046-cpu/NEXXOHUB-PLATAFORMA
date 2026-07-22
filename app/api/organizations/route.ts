import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorResponse } from '../../../lib/errors';
import { requireAuth, requireAdmin } from '../../../lib/api/auth-helpers';
import { createOrganizationSchema, updateOrganizationSchema } from '../../../lib/validations/organization';
import { serialize } from '../../../lib/serialize';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single();

    if (orgError) {
      throw new Error('Organization not found');
    }

    return NextResponse.json({
      success: true,
      data: serialize(org),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { user } = await requireAuth(supabase);

    const body = await req.json();
    const validatedData = createOrganizationSchema.parse(body);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([validatedData])
      .select()
      .single();

    if (orgError || !org) {
      throw new Error('Failed to create organization');
    }

    const organization = org as unknown as { id: string };

    const { error: updateError } = await supabase
      .from('users')
      .update({ organization_id: organization.id, role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update user organization');
    }

    return NextResponse.json(
      {
        success: true,
        data: serialize(org),
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profile } = await requireAuth(supabase);
    requireAdmin(profile, 'Apenas administradores podem editar a organização');

    const body = await req.json();
    const validatedData = updateOrganizationSchema.parse(body);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .update(validatedData)
      .eq('id', profile.organization_id)
      .select()
      .single();

    if (orgError) {
      throw new Error('Failed to update organization');
    }

    return NextResponse.json({
      success: true,
      data: serialize(org),
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
