'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileChartColumn,
  FileCheck2,
  FileWarning,
  GitBranch,
  GraduationCap,
  HandHeart,
  HelpCircle,
  Home,
  Layers,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UploadCloud,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { portalConfig, type PortalType } from '../../lib/portal';
import { BrandMark } from '../workspace/brand-mark';

type MenuItem = { label: string; href: string; icon: LucideIcon };

const portalMenus: Record<Exclude<PortalType, 'nexxohub'>, MenuItem[]> = {
  clinic: [
    { label: 'Dashboard', href: '/clinic', icon: Home },
    { label: 'Empresas', href: '/clinic/companies', icon: Building2 },
    { label: 'Conformidade NR-1/PGR', href: '/clinic/compliance', icon: ShieldCheck },
    { label: 'Conteúdos e Treinamentos', href: '/clinic/content', icon: GraduationCap },
    { label: 'Acompanhamento', href: '/clinic/follow-up', icon: Users },
    { label: 'Relatórios', href: '/clinic/reports', icon: FileChartColumn },
    { label: 'Configurações', href: '/clinic/settings', icon: Settings },
  ],
  company: [
    { label: 'Dashboard', href: '/company', icon: Home },
    { label: 'Filiais', href: '/company/branches', icon: GitBranch },
    { label: 'Departamentos', href: '/company/departments', icon: Layers },
    { label: 'Cargos', href: '/company/positions', icon: BriefcaseBusiness },
    { label: 'Colaboradores', href: '/company/employees', icon: Users },
    { label: 'Importações', href: '/company/organization', icon: UploadCloud },
    { label: 'Programas Disponíveis', href: '/company/programs', icon: GraduationCap },
    { label: 'Aulas Disponíveis', href: '/company/classes', icon: BookOpen },
    { label: 'Certificados', href: '/company/certificates', icon: Award },
    { label: 'Diagnósticos', href: '/company/diagnostics', icon: ShieldCheck },
    { label: 'Evidências', href: '/company/evidences', icon: ClipboardCheck },
    { label: 'Dossiê NR-1', href: '/company/nr1-dossier', icon: FileCheck2 },
    { label: 'Denúncias', href: '/company/complaints', icon: FileWarning },
    { label: 'Pedidos de Ajuda', href: '/company/help-requests', icon: HandHeart },
    { label: 'Relatórios', href: '/company/reports', icon: FileChartColumn },
    { label: 'Configurações', href: '/company/settings', icon: Settings },
  ],
  employee: [
    { label: 'Dashboard', href: '/employee', icon: Home },
    { label: 'Programas', href: '/employee/programs', icon: GraduationCap },
    { label: 'Aulas e Módulos', href: '/employee/classes', icon: BookOpen },
    { label: 'Check-in Semanal', href: '/employee/checkins', icon: ClipboardCheck },
    { label: 'Pedido de Ajuda', href: '/employee/help-requests', icon: HelpCircle },
    { label: 'Denúncia', href: '/employee/complaints', icon: FileWarning },
    { label: 'Certificados', href: '/employee/certificates', icon: Award },
    { label: 'Minha Atividade', href: '/employee/activity', icon: Activity },
    { label: 'Configurações', href: '/employee/settings', icon: Settings },
  ],
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'NX'
  );
}

export function PortalShell({
  portal,
  children,
  entityName,
  entitySubtitle,
  userName,
  userRole,
}: {
  portal: Exclude<PortalType, 'nexxohub'>;
  children: React.ReactNode;
  entityName?: string;
  entitySubtitle?: string;
  userName?: string;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const config = portalConfig[portal];
  const displayEntity =
    entityName ||
    (portal === 'clinic' ? 'Clínica' : portal === 'company' ? 'Empresa' : 'Meu perfil');
  const displayUser = userName || 'Usuário NexxoHub';
  const EntityIcon = portal === 'employee' ? UserRound : Building2;

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace(`/auth/login?portal=${portal}`);
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-cyan-900/30 bg-[radial-gradient(circle_at_30%_20%,rgba(5,79,121,0.25),transparent_32%),linear-gradient(180deg,#02162f_0%,#011126_100%)] text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[92px] shrink-0 items-center justify-between px-5">
          <BrandMark href={config.home} subtitle={config.label} />
          <button type="button" onClick={() => setOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mb-3 rounded-xl border border-white/5 bg-white/[0.055] p-3 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-slate-100 ring-1 ring-cyan-300/15">
              <EntityIcon className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{displayEntity}</p>
              <p className="mt-1 truncate text-[10px] text-slate-300">
                {entitySubtitle || 'Administrador'}
              </p>
            </div>
            <span className="text-xs text-slate-300">⌄</span>
          </div>
        </div>

        <nav className="workspace-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {portalMenus[portal].map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href !== config.home && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-[0_8px_25px_rgba(8,145,178,0.28)]'
                    : 'text-slate-100 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-4 mt-0 shrink-0 rounded-xl border border-white/5 bg-white/[0.055]">
          <div className="flex items-center gap-3 border-b border-white/5 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 text-xs font-semibold">
              {initials(displayUser)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{displayUser}</p>
              <p className="mt-1 truncate text-[10px] text-slate-300">
                {userRole || 'Administrador'}
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

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-20 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-lg lg:hidden"
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
