'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileWarning,
  GitBranch,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { portalConfig, type PortalType } from '../../lib/portal';

const portalMenus = {
  clinic: [
    { label: 'Dashboard', href: '/clinic', icon: Home },
    { label: 'Empresas', href: '/clinic/companies', icon: Building2 },
    { label: 'Programas', href: '/clinic/programs', icon: GraduationCap },
    { label: 'Evidências', href: '/clinic/evidences', icon: ClipboardCheck },
    { label: 'Dossiês NR-1', href: '/clinic/nr1-dossiers', icon: ShieldCheck },
  ],
  company: [
    { label: 'Dashboard', href: '/company', icon: Home },
    { label: 'Colaboradores', href: '/company/employees', icon: Users },
    { label: 'Filiais', href: '/company/branches', icon: GitBranch },
    { label: 'Departamentos', href: '/company/departments', icon: Layers },
    { label: 'Cargos', href: '/company/positions', icon: UserRound },
    { label: 'Pedidos de Ajuda', href: '/company/help-requests', icon: HelpCircle },
    { label: 'Denúncias', href: '/company/complaints', icon: FileWarning },
    { label: 'Certificados', href: '/company/certificates', icon: Award },
  ],
  employee: [
    { label: 'Dashboard', href: '/employee', icon: Home },
    { label: 'Programas', href: '/employee/programs', icon: BookOpen },
    { label: 'Check-in Semanal', href: '/employee/checkins', icon: ClipboardCheck },
    { label: 'Pedido de Ajuda', href: '/employee/help-requests', icon: HelpCircle },
    { label: 'Denúncia', href: '/employee/complaints', icon: FileWarning },
    { label: 'Certificados', href: '/employee/certificates', icon: Award },
  ],
} satisfies Record<
  Exclude<PortalType, 'nexxohub'>,
  Array<{ label: string; href: string; icon: typeof Home }>
>;

export function PortalShell({
  portal,
  children,
}: {
  portal: Exclude<PortalType, 'nexxohub'>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const config = portalConfig[portal];

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace(`/auth/login?portal=${portal}`);
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={`fixed inset-y-0 z-40 w-64 bg-[#03152f] text-white transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href={config.home} className="font-semibold">
            Nexxo<span className="text-cyan-400">Hub</span>
            <span className="block text-[10px] font-normal text-slate-300">{config.label}</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {portalMenus[portal].map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href !== config.home && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                  active ? 'bg-blue-600' : 'hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" /> {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
          <button className="rounded-lg border p-2 lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
              <ShieldCheck className="h-4 w-4 text-blue-600" /> {config.label}
            </span>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
            >
              <LogOut className="h-4 w-4" /> {signingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
