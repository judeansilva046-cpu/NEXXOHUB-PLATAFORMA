import { FinanceShell } from '../../components/layout/finance-shell';
import { userDisplayName } from '../../lib/portal-display';
import { requireNexxoHubRole } from '../../lib/nexxohub-context';

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireNexxoHubRole(['nexxohub_admin', 'nexxohub_finance']);
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <FinanceShell userName={profile?.full_name || userDisplayName(user)}>{children}</FinanceShell>
  );
}
