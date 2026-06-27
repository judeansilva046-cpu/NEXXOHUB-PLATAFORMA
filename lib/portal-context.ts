import { AuthenticationError, AuthorizationError } from './errors';
import type { PortalType } from './portal';
import { roleBelongsToPortal } from './rbac';
import { createClient } from './supabase/server';

export type PortalMembership = {
  portal: PortalType;
  role: string;
  organization_id: string;
  clinic_id: string | null;
  company_id: string | null;
  employee_id: string | null;
};

export async function requirePortalContext(portal: Exclude<PortalType, 'nexxohub'>) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError();
  }

  const { data: membership, error } = await supabase
    .from('portal_memberships')
    .select('portal, role, organization_id, clinic_id, company_id, employee_id')
    .eq('user_id', user.id)
    .eq('portal', portal)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const typedMembership = membership as PortalMembership | null;

  if (error || !typedMembership || !roleBelongsToPortal(typedMembership.role, portal)) {
    throw new AuthorizationError();
  }

  return { supabase, user, membership: typedMembership };
}
