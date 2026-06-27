import { AuthenticationError, AuthorizationError } from './errors';
import { normalizeRole, type NexxoHubRole } from './rbac';
import { createClient } from './supabase/server';

export type NexxoHubMembership = {
  portal: 'nexxohub';
  role: string;
  organization_id: string;
};

export async function requireNexxoHubRole(allowedRoles: NexxoHubRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new AuthenticationError();

  const { data, error } = await supabase
    .from('portal_memberships')
    .select('portal, role, organization_id')
    .eq('user_id', user.id)
    .eq('portal', 'nexxohub')
    .eq('is_active', true);

  if (error) throw error;

  const membership = (data || []).find((item) =>
    allowedRoles.includes(normalizeRole(item.role) as NexxoHubRole)
  ) as NexxoHubMembership | undefined;

  if (!membership) throw new AuthorizationError();

  return { supabase, user, membership };
}
