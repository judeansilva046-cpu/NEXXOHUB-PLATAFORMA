import { AuthenticationError, AuthorizationError } from './errors';
import { createClient } from './supabase/server';

export type ApiProfile = {
  organization_id: string;
  role: string;
};

export async function requireApiContext(allowedRoles?: readonly string[]) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError();
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new AuthenticationError();
  }

  const typedProfile = profile as ApiProfile;
  if (allowedRoles && !allowedRoles.includes(typedProfile.role)) {
    throw new AuthorizationError();
  }

  return { supabase, user, profile: typedProfile };
}
