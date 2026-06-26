'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardCheck,
  BadgeDollarSign,
  FileText,
  Home,
  Hospital,
  Lightbulb,
  Megaphone,
  MessageCircleQuestion,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Organizações', href: '/dashboard/organizations', icon: Building2 },
  { label: 'Clínicas', href: '/dashboard/clinics', icon: Hospital },
  { label: 'Empresas', href: '/dashboard/companies', icon: ShieldCheck },
  { label: 'Colaboradores', href: '/dashboard/employees', icon: Users },
  { label: 'Avaliações', href: '/dashboard/assessments', icon: ClipboardCheck },
  { label: 'Relatórios', href: '/dashboard/reports', icon: FileText },
  { label: 'NR-1', href: '/dashboard/nr1', icon: BarChart3 },
  { label: 'Contratos', href: '/dashboard/contracts', icon: FileText },
  { label: 'Financeiro', href: '/dashboard/finance', icon: BadgeDollarSign },
  { label: 'Documentos', href: '/dashboard/documents', icon: FileText },
  { label: 'Insights IA', href: '/dashboard/insights', icon: Lightbulb, pending: true },
  { label: 'Planos de Ação', href: '/dashboard/action-plans', icon: Activity, pending: true },
  { label: 'Comunicações', href: '/dashboard/communications', icon: Megaphone, pending: true },
  { label: 'Configurações', href: '/dashboard/settings', icon: Settings, pending: true },
];

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3" aria-label="NexxoHub">
      <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M7 37V11l17 14 17-14v26L24 23 7 37Z" stroke="#18c7ef" strokeWidth="3" />
        <circle cx="7" cy="11" r="4" fill="#22d3ee" />
        <circle cx="7" cy="37" r="4" fill="#2563eb" />
        <circle cx="24" cy="25" r="3.5" fill="#38bdf8" />
        <circle cx="41" cy="11" r="4" fill="#22d3ee" />
        <circle cx="41" cy="37" r="4" fill="#2563eb" />
      </svg>
      <span>
        <span className="block text-2xl font-semibold tracking-tight text-white">
          Nexxo<span className="text-cyan-400">Hub</span>
        </span>
        <span className="block text-[9px] text-slate-300">Plataforma de Gestão Psicossocial</span>
      </span>
    </Link>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

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
        className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-blue-900/60 bg-[linear-gradient(180deg,#03152f_0%,#020d20_100%)] text-white shadow-2xl transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-24 items-center justify-between px-5">
          <Logo />
          <button className="rounded-lg p-2 text-slate-300 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {navigation.map(({ label, href, icon: Icon, pending }) => {
            const active =
              pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
            if (pending) {
              return (
                <div
                  key={href}
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-500"
                  title="Módulo em implantação"
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1">{label}</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase">
                    Em breve
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-[0_8px_22px_rgba(37,99,235,0.3)]'
                    : 'text-slate-200 hover:bg-white/7 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-xl border border-blue-700/60 bg-blue-950/45 p-4">
          <div className="flex items-center gap-3">
            <MessageCircleQuestion className="h-7 w-7 text-cyan-400" />
            <div>
              <p className="text-sm font-semibold">Precisa de ajuda?</p>
              <p className="mt-0.5 text-xs text-slate-300">Fale com nosso suporte.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
