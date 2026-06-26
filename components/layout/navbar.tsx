'use client';

import Link from 'next/link';
import { Bell, CalendarDays, ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { useState } from 'react';

export function Navbar({
  onOpenMenu,
  userName,
  userRole,
  unreadNotifications = 0,
}: {
  onOpenMenu: () => void;
  userName?: string;
  userRole?: string;
  unreadNotifications?: number;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível encerrar a sessão.');
      window.location.replace('/auth/login');
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Erro ao sair.');
      setIsSigningOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenMenu}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {signOutError && (
            <span className="hidden text-xs text-red-600 md:block">{signOutError}</span>
          )}
          <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] text-white">
                {unreadNotifications}
              </span>
            )}
          </button>
          <Link
            href="/dashboard/profile"
            className="hidden items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50 sm:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <UserRound className="h-5 w-5 text-blue-700" />
            </span>
            <span className="hidden text-left xl:block">
              <span className="block max-w-36 truncate text-sm font-semibold text-slate-900">
                {userName || 'Perfil'}
              </span>
              <span className="block text-xs capitalize text-slate-500">
                {userRole || 'usuário'}
              </span>
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{isSigningOut ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      </div>
      <div className="flex justify-end border-t border-slate-100 px-4 py-2 sm:px-6 lg:px-8">
        <button className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
          <CalendarDays className="h-4 w-4 text-blue-700" />
          <span>Últimos 30 dias</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
