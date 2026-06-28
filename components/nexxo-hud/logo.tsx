export function NexxoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-4" aria-label="NexxoHub">
      <span className={compact ? 'text-xl font-semibold tracking-wider' : 'text-2xl font-semibold tracking-[.04em] sm:text-3xl'}>NEXXOHUB</span>
      {!compact && <span className="hidden h-7 items-center gap-[2px] md:flex" aria-hidden="true">{Array.from({length:34},(_,i)=><i key={i} className="w-px bg-cyan-400" style={{height: `${5 + Math.abs(Math.sin(i*.7))*22}px`}} />)}</span>}
    </div>
  );
}
