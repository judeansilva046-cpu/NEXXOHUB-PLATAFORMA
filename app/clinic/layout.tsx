import { PortalShell } from '../../components/layout/portal-shell';

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="clinic">{children}</PortalShell>;
}
