import { ReactNode } from 'react';

export function HudPanel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`hud-panel hud-corners p-3 ${className}`}><h2 className="mb-3 border-b border-cyan-400/10 pb-2 text-[11px] font-medium uppercase tracking-[.14em] text-cyan-100">{title}</h2>{children}</section>;
}
