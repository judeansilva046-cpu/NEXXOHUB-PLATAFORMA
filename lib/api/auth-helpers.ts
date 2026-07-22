import { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError, AuthorizationError } from '../errors';

export type UserProfile = {
  organization_id: string;
  role: 'admin' | 'manager' | 'user';
};

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError();
  }

  return user;
}

export async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile> {
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  const profile = userProfile as unknown as { organization_id?: string };

  if (error || !profile?.organization_id) {
    throw new AuthenticationError('Perfil de usuário não encontrado');
  }

  return profile as UserProfile;
}

export async function requireAuth(supabase: SupabaseClient) {
  const user = await getAuthenticatedUser(supabase);
  const profile = await getUserProfile(supabase, user.id);
  return { user, profile };
}

export function requireAdmin(profile: UserProfile, message = 'Apenas administradores podem realizar esta ação') {
  if (profile.role !== 'admin') {
    throw new AuthorizationError(message);
  }
}

export function requireAdminOrManager(
  profile: UserProfile,
  message = 'Apenas administradores ou gerentes podem realizar esta ação'
) {
  if (!['admin', 'manager'].includes(profile.role)) {
    throw new AuthorizationError(message);
  }
}
