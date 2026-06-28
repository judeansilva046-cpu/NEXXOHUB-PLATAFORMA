'use client';

import { useEffect, useState } from 'react';
import { AdminMobileMenuButton, Sidebar } from './sidebar';

type UserData = {
  full_name?: string;
  fullName?: string;
  role?: string;
  memberships?: Array<{ portal: string; role: string }>;
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => setUser(result?.data || null))
      .catch(() => setUser(null));
  }, []);

  const membershipRole = user?.memberships?.find(
    (membership) => membership.portal === 'nexxohub'
  )?.role;

  return (
    <div className="flex min-h-[100svh] bg-[#f7f9fc] text-[#071737]">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={user?.full_name || user?.fullName}
        userRole={membershipRole || user?.role}
      />
      <AdminMobileMenuButton onClick={() => setMenuOpen(true)} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-16 sm:p-6 sm:pt-16 lg:p-6 xl:p-7">
        <div className="mx-auto w-full max-w-[1560px]">{children}</div>
      </main>
    </div>
  );
}
