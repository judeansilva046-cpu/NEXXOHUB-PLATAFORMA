import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, ValidationError, getErrorResponse } from '@/lib/errors';
import { createOrganizationSchema } from '@/lib/validations/organization';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Get user's organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userOrgError || !userOrg) {
      throw new Error('User organization not found');
    }

    // Get organization data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userOrg.organization_id)
      .single();

    if (orgError) {
      throw new Error('Organization not found');
    }

    return NextResponse.json({
      success: true,
      data: org,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const body = await req.json();
    const validatedData = createOrganizationSchema.parse(body);

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([validatedData])
      .select()
      .single();

    if (orgError) {
      throw new Error('Failed to create organization');
    }

    // Update user with organization_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ organization_id: org.id })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update user organization');
    }

    return NextResponse.json(
      {
        success: true,
        data: org,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
