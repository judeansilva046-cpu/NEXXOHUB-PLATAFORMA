'use client';

import { useEffect, useState } from 'react';

export function RealtimeClock() {
  const [now, setNow] = useState<Date>();
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <div className="h-12 w-36 animate-pulse rounded bg-cyan-400/5" />;
  const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(now);
  const time = now.toLocaleTimeString('pt-BR');
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(now);
  return (
    <div className="text-right uppercase leading-none">
      <p className="text-[10px] tracking-[.18em] text-slate-400">{date}</p>
      <time className="mt-1 block font-mono text-2xl font-light tracking-widest text-cyan-100 sm:text-3xl">{time}</time>
      <p className="mt-1 text-[10px] tracking-[.25em] text-cyan-400">{weekday}</p>
    </div>
  );
}
