import type { LucideIcon } from 'lucide-react';

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-violet-50 text-violet-600',
  orange: 'bg-orange-50 text-orange-500',
  red: 'bg-red-50 text-red-500',
  cyan: 'bg-cyan-50 text-cyan-600',
} as const;

export type MetricTone = keyof typeof toneClasses;

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  trend,
  trendDirection = 'up',
  hint = 'vs mês anterior',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: MetricTone;
  trend?: string;
  trendDirection?: 'up' | 'down';
  hint?: string;
}) {
  const positive = trendDirection === 'up';

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="min-h-8 text-xs font-medium leading-4 text-[#081a3d]">{label}</p>
          <p className="mt-0.5 truncate text-[25px] font-bold tracking-[-0.04em] text-[#061432]">
            {value}
          </p>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className={`font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? '↑' : '↓'} {trend}
          </span>
          <span className="truncate text-slate-500">{hint}</span>
        </div>
      )}
    </section>
  );
}
