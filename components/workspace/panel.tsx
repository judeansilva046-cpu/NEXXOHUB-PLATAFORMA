import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function WorkspacePanel({
  title,
  children,
  action,
  footerLabel,
  footerHref = '#',
  className = '',
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  footerLabel?: string;
  footerHref?: string;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h2 className="text-sm font-semibold text-[#071a43]">{title}</h2>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
      {footerLabel && (
        <Link
          href={footerHref}
          className="mx-5 flex items-center justify-between border-t border-slate-100 py-4 text-xs font-semibold text-blue-700"
        >
          {footerLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}

export function StatusPill({
  label,
  tone = 'green',
}: {
  label: string;
  tone?: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'slate';
}) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${colors[tone]}`}>{label}</span>
  );
}

export function EmptyWorkspaceState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
