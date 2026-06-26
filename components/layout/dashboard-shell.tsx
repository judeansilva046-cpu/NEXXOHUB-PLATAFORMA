'use client';

import { useEffect, useState } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

type UserData = { full_name?: string; fullName?: string; role?: string };

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => setUser(result?.data || null))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="flex min-h-[100svh] bg-[#f5f7fb]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0 flex-1">
        <Navbar
          onOpenMenu={() => setMenuOpen(true)}
          userName={user?.full_name || user?.fullName}
          userRole={user?.role}
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
