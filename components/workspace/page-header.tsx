'use client';

import { Bell, CalendarDays, ChevronDown, Menu } from 'lucide-react';

function monthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const format = (date: Date) =>
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${format(first)} - ${format(last)}`;
}

export function PageHeader({
  title,
  subtitle,
  userName = 'NexxoHub',
  notifications = 0,
  onOpenMenu,
}: {
  title: string;
  subtitle: string;
  userName?: string;
  notifications?: number;
  onOpenMenu?: () => void;
}) {
  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'NX';

  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="mt-0.5 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.035em] text-[#061432] sm:text-[30px]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-[15px]">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
        <button
          type="button"
          className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#071737] shadow-sm"
        >
          <CalendarDays className="h-5 w-5 text-[#071737]" />
          <span>{monthRange()}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl text-[#071737] hover:bg-white"
          aria-label="Notificações"
        >
          <Bell className="h-6 w-6" />
          {notifications > 0 && (
            <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#f7f9fc]">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </button>
        <button type="button" className="flex items-center gap-2" aria-label="Menu do usuário">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#02142f] text-sm font-semibold text-white">
            {initials}
          </span>
          <ChevronDown className="h-4 w-4 text-[#071737]" />
        </button>
      </div>
    </header>
  );
}
