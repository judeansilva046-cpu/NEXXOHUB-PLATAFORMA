import { QuickOnboardingClient } from '../../../components/quick-onboarding/quick-onboarding-client';
import { requirePortalContext } from '../../../lib/portal-context';
import type { QuickImportType } from '../../../lib/quick-onboarding/config';

const companyImportTypes: QuickImportType[] = ['branches', 'departments', 'positions', 'employees'];

export default async function CompanyOrganizationPage() {
  const { supabase, membership } = await requirePortalContext('company');

  const [
    { data: company },
    { data: imports },
    { count: connectionsCount },
    { count: syncLogsCount },
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, legal_name, cnpj, status')
      .eq('id', membership.company_id)
      .single(),
    supabase
      .from('quick_onboarding_imports')
      .select(
        'id, import_type, status, original_filename, total_rows, valid_rows, invalid_rows, created_count, updated_count, error_count, created_at, completed_at, companies(name)'
      )
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('integration_connections')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', membership.company_id),
    supabase
      .from('integration_sync_logs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', membership.company_id),
  ]);

  return (
    <QuickOnboardingClient
      scope="company"
      endpointBase="/api/company/organization-imports"
      allowedTypes={companyImportTypes}
      companies={company ? [company] : []}
      imports={imports || []}
      integrations={{
        connectionsCount: connectionsCount || 0,
        syncLogsCount: syncLogsCount || 0,
      }}
    />
  );
}
