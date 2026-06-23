import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, getErrorResponse } from '../../../lib/errors';
import { createOrganizationSchema } from '../../../lib/validations/organization';

type UserOrg = {
  organization_id?: string;
};

type OrganizationData = {
  id?: string;
};

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const { data: userOrg, error: userOrgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = userOrg as unknown as UserOrg;

    if (userOrgError || !profile?.organization_id) {
      throw new Error('User organization not found');
    }

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
      data: org,
    });
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const body = await req.json();
    const validatedData = createOrganizationSchema.parse(body);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([validatedData])
      .select()
      .single();

    const organization = org as unknown as OrganizationData;

    if (orgError || !organization?.id) {
      throw new Error('Failed to create organization');
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ organization_id: organization.id })
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