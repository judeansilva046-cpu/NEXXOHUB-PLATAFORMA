import { DashboardShell } from '../../components/layout/dashboard-shell';

export default function NexxoHubLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
