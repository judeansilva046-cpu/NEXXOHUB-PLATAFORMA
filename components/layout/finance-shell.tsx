'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  FileChartColumn,
  FileText,
  Landmark,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '../workspace/brand-mark';

const navigation: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: 'Dashboard Financeiro', href: '/finance', icon: BarChart3 },
  { label: 'Assinaturas', href: '/finance/subscriptions', icon: CreditCard },
  { label: 'Planos', href: '/finance/plans', icon: FileText },
  { label: 'Faturas', href: '/finance/invoices', icon: ReceiptText },
  { label: 'Pagamentos', href: '/finance/payments', icon: WalletCards },
  { label: 'Receitas', href: '/finance/revenue', icon: CircleDollarSign },
  { label: 'Inadimplência', href: '/finance/delinquency', icon: Landmark },
  { label: 'Relatórios', href: '/finance/reports', icon: FileChartColumn },
  { label: 'Fluxo de Caixa', href: '/finance/cash-flow', icon: ChartNoAxesCombined },
  { label: 'Clientes (Clínicas)', href: '/finance/clients', icon: Building2 },
  { label: 'Configurações', href: '/finance/settings', icon: Settings },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function FinanceShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace('/auth/login?portal=nexxohub');
  };

  return (
    <div className="flex min-h-[100svh] bg-[#f7f9fc] text-[#071737]">
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/55 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[262px] flex-col border-r border-blue-900/30 bg-[radial-gradient(circle_at_30%_20%,rgba(34,45,128,0.28),transparent_34%),linear-gradient(180deg,#03162f_0%,#071432_100%)] text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[100px] shrink-0 items-center justify-between px-5">
          <BrandMark href="/finance" subtitle="Gestão Financeira da Plataforma" compact />
          <button type="button" onClick={() => setOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="workspace-scrollbar flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href !== '/finance' && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_8px_24px_rgba(79,70,229,0.28)]'
                    : 'text-slate-100 hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.7} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="m-4 mt-0 rounded-xl border border-white/5 bg-white/[0.055]">
          <div className="flex items-center gap-3 border-b border-white/5 p-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold">
              {initials(userName) || 'FA'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{userName}</p>
              <p className="mt-1 text-[10px] text-slate-300">Financeiro</p>
            </div>
            <span className="text-xs text-slate-300">⌄</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-xs text-slate-100 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> {signingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </aside>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-20 rounded-xl border bg-white p-2.5 shadow-lg lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-16 sm:p-6 sm:pt-16 lg:p-6 xl:p-7">
        <div className="mx-auto w-full max-w-[1560px]">{children}</div>
      </main>
    </div>
  );
}
