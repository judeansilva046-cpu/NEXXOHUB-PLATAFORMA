import { ClinicCompaniesClient } from './clinic-companies-client';
import { AuthorizationError } from '../../../lib/errors';
import { mapCompany } from '../../../lib/domain-mappers';
import { loadClinicWorkspaceSnapshot } from '../../../lib/clinic-guidance';
import { requirePortalContext } from '../../../lib/portal-context';
import { normalizeRole } from '../../../lib/rbac';
import type { Company } from '../../../types';

export default async function ClinicCompaniesPage() {
  const { supabase, membership } = await requirePortalContext('clinic');

  if (!membership.clinic_id) {
    throw new AuthorizationError('A clínica não foi encontrada para este usuário.');
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('id', membership.clinic_id)
    .eq('organization_id', membership.organization_id)
    .single();

  if (clinicError || !clinic) throw new AuthorizationError('Clínica não autorizada.');

  const { data, error } = await supabase
    .from('companies')
    .select('*, clinics(name)')
    .eq('clinic_id', membership.clinic_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const companies = (data || []).map((row) => mapCompany(row) as Company);
  const canManage = normalizeRole(membership.role) === 'clinic_admin';
  const snapshot = await loadClinicWorkspaceSnapshot(supabase, {
    clinicId: membership.clinic_id,
    organizationId: membership.organization_id,
  });

  return (
    <ClinicCompaniesClient
      clinic={clinic}
      initialCompanies={companies}
      canManage={canManage}
      implementations={snapshot.implementations}
    />
  );
}
