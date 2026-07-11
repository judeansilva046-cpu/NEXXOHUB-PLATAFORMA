'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeDollarSign,
  Blocks,
  ClipboardCheck,
  CreditCard,
  FileClock,
  Gauge,
  Headphones,
  Home,
  Hospital,
  KeyRound,
  LockKeyhole,
  LogOut,
  Menu,
  Network,
  PlayCircle,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { portalRoleLabel } from '../../lib/portal-display';
import { BrandMark } from '../workspace/brand-mark';

type NavigationItem = { label: string; href: string; icon: LucideIcon };

const navigation: NavigationItem[] = [
  { label: 'Visão geral', href: '/admin', icon: Home },
  { label: 'Acessos administrativos', href: '/admin/access/users', icon: Users },
  { label: 'Perfis e permissões', href: '/admin/access/roles', icon: KeyRound },
  { label: 'Sessões e dispositivos', href: '/admin/access/sessions', icon: ShieldCheck },
  { label: 'Clínicas', href: '/admin/clinics', icon: Hospital },
  { label: 'Usuários internos', href: '/admin/internal-users', icon: Headphones },
  { label: 'Planos', href: '/admin/plans', icon: BadgeDollarSign },
  { label: 'Contratos', href: '/admin/contracts', icon: FileClock },
  { label: 'Assinaturas', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Cobranças e pagamentos', href: '/admin/billing', icon: BadgeDollarSign },
  { label: 'Bloqueios e suspensões', href: '/admin/blocks', icon: LockKeyhole },
  { label: 'Módulos e permissões', href: '/admin/modules', icon: Blocks },
  { label: 'Integrações', href: '/admin/integrations', icon: Network },
  { label: 'Automações', href: '/admin/automations', icon: PlayCircle },
  { label: 'Monitoramento', href: '/admin/monitoring', icon: Gauge },
  { label: 'Auditoria', href: '/admin/audit', icon: ClipboardCheck },
  { label: 'Segurança', href: '/admin/security', icon: LockKeyhole },
];

function initials(name?: string) {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'NA'
  );
}

export function Sidebar({
  open,
  onClose,
  userName,
  userRole,
}: {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const displayName = userName || 'NexxoHub Admin';

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace('/auth/login?portal=nexxohub');
  };

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/55 lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[282px] flex-col border-r border-cyan-900/30 bg-[radial-gradient(circle_at_30%_20%,rgba(5,79,121,0.24),transparent_32%),linear-gradient(180deg,#02162f_0%,#011126_100%)] text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[100px] shrink-0 items-center justify-between px-5">
          <BrandMark href="/admin" subtitle="Admin Central" />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="workspace-scrollbar flex-1 space-y-0.5 overflow-y-auto px-4 pb-4">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-[0_8px_25px_rgba(8,145,178,0.28)]'
                    : 'text-slate-100 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-5 mt-0 shrink-0 rounded-xl border border-white/5 bg-white/[0.055]">
          <div className="flex items-center gap-3 border-b border-white/5 p-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 text-xs font-semibold">
              {initials(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{displayName}</p>
              <p className="mt-1 truncate text-[10px] text-slate-300">
                {portalRoleLabel(userRole || 'nexxohub_admin')}
              </p>
            </div>
            <span className="text-xs text-slate-300">⌄</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-xs text-slate-100 transition hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> {signingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed left-3 top-3 z-20 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-lg lg:hidden"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
