import { PortalShell } from '../../components/layout/portal-shell';
import { portalRoleLabel, userDisplayName } from '../../lib/portal-display';
import { requirePortalContext } from '../../lib/portal-context';

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, membership } = await requirePortalContext('company');
  const [{ data: company }, { data: profile }] = await Promise.all([
    membership.company_id
      ? supabase
          .from('companies')
          .select('name, cnpj')
          .eq('id', membership.company_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('users').select('full_name').eq('id', user.id).maybeSingle(),
  ]);

  return (
    <PortalShell
      portal="company"
      entityName={company?.name || 'Empresa NexxoHub'}
      entitySubtitle={company?.cnpj ? `Matriz · CNPJ ${company.cnpj}` : 'Gestão empresarial'}
      userName={profile?.full_name || userDisplayName(user)}
      userRole={portalRoleLabel(membership.role)}
    >
      {children}
    </PortalShell>
  );
}
