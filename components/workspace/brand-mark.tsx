import Link from 'next/link';

export function BrandMark({
  href,
  subtitle,
  compact = false,
}: {
  href: string;
  subtitle: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="NexxoHub">
      <svg
        className={compact ? 'h-9 w-9' : 'h-11 w-11'}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 37V11l17 14 17-14v26L24 23 7 37Z"
          stroke="url(#nexxohub-brand-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="11" r="4" fill="#22d3ee" />
        <circle cx="7" cy="37" r="4" fill="#2563eb" />
        <circle cx="24" cy="25" r="3.5" fill="#38bdf8" />
        <circle cx="41" cy="11" r="4" fill="#2dd4bf" />
        <circle cx="41" cy="37" r="4" fill="#2563eb" />
        <defs>
          <linearGradient id="nexxohub-brand-gradient" x1="4" y1="42" x2="44" y2="6">
            <stop stopColor="#2563eb" />
            <stop offset="0.5" stopColor="#0ea5e9" />
            <stop offset="1" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
      </svg>
      <span className="min-w-0">
        <span
          className={`${compact ? 'text-xl' : 'text-2xl'} block font-semibold tracking-[-0.04em] text-white`}
        >
          Nexxo<span className="text-teal-400">Hub</span>
        </span>
        <span className="block truncate text-[10px] text-slate-300">{subtitle}</span>
      </span>
    </Link>
  );
}
