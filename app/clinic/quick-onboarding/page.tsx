import { QuickOnboardingClient } from '../../../components/quick-onboarding/quick-onboarding-client';
import { requirePortalContext } from '../../../lib/portal-context';
import { listQuickOnboardingData } from '../../../lib/quick-onboarding/service';

export default async function QuickOnboardingPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  const data = await listQuickOnboardingData(supabase, membership);

  return (
    <QuickOnboardingClient
      companies={data.companies}
      imports={data.imports}
      integrations={data.integrations}
    />
  );
}
