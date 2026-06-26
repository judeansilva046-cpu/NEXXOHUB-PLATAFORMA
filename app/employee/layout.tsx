import { PortalShell } from '../../components/layout/portal-shell';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="employee">{children}</PortalShell>;
}
