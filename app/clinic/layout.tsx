import { PortalShell } from '../../components/layout/portal-shell';
import { portalRoleLabel, userDisplayName } from '../../lib/portal-display';
import { requirePortalContext } from '../../lib/portal-context';

export default async function ClinicLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, membership } = await requirePortalContext('clinic');
  const [{ data: clinic }, { data: profile }] = await Promise.all([
    membership.clinic_id
      ? supabase.from('clinics').select('name, cnpj').eq('id', membership.clinic_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('users').select('full_name').eq('id', user.id).maybeSingle(),
  ]);

  return (
    <PortalShell
      portal="clinic"
      entityName={clinic?.name || 'Clínica NexxoHub'}
      entitySubtitle={clinic?.cnpj ? `CNPJ ${clinic.cnpj}` : 'Operação da clínica'}
      userName={profile?.full_name || userDisplayName(user)}
      userRole={portalRoleLabel(membership.role)}
    >
      {children}
    </PortalShell>
  );
}
