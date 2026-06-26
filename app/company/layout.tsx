import { PortalShell } from '../../components/layout/portal-shell';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="company">{children}</PortalShell>;
}
