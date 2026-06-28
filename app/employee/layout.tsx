import { PortalShell } from '../../components/layout/portal-shell';
import { portalRoleLabel, userDisplayName } from '../../lib/portal-display';
import { requirePortalContext } from '../../lib/portal-context';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, membership } = await requirePortalContext('employee');
  const [{ data: employee }, { data: company }, { data: profile }] = await Promise.all([
    membership.employee_id
      ? supabase
          .from('employees')
          .select('full_name, position')
          .eq('id', membership.employee_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    membership.company_id
      ? supabase.from('companies').select('name').eq('id', membership.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('users').select('full_name').eq('id', user.id).maybeSingle(),
  ]);

  return (
    <PortalShell
      portal="employee"
      entityName={company?.name || 'Empresa'}
      entitySubtitle={employee?.position || 'Minha jornada'}
      userName={employee?.full_name || profile?.full_name || userDisplayName(user)}
      userRole={portalRoleLabel(membership.role)}
    >
      {children}
    </PortalShell>
  );
}
