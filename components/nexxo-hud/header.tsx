'use client';

import { motion } from 'framer-motion';
import { Menu, Radio } from 'lucide-react';
import { useState } from 'react';
import { NexxoLogo } from './logo';
import { RealtimeClock } from './realtime-clock';

const tabs = ['Painel Principal', 'Sistemas', 'Rede', 'Análises', 'Configurações'];

export function Header() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <header className="hud-panel relative flex min-h-[86px] items-center justify-between gap-5 px-4 py-3 sm:px-6">
      <div><NexxoLogo /><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-cyan-400">Sua operação. Totalmente conectada.</p></div>
      <nav className="hidden flex-1 justify-center lg:flex" aria-label="Navegação principal">
        {tabs.map((tab, index) => (
          <button key={tab} onClick={() => setActive(index)} className={`relative min-w-28 px-5 py-3 text-[11px] uppercase tracking-wider transition ${active === index ? 'text-white' : 'text-slate-400 hover:text-cyan-200'}`}>
            {active === index && <motion.span layoutId="active-tab" className="absolute inset-0 rounded border border-cyan-400/50 bg-cyan-400/10 shadow-[inset_0_0_20px_rgba(34,211,238,.1)]" />}
            <span className="relative">{tab}</span>
          </button>
        ))}
      </nav>
      <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 items-center gap-2 px-8 py-1 text-[10px] font-medium tracking-[.2em] text-emerald-300 xl:flex">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /> SISTEMA ONLINE
      </div>
      <div className="hidden sm:block"><RealtimeClock /></div>
      <button onClick={() => setOpen(!open)} className="rounded border border-cyan-500/30 p-2 text-cyan-300 lg:hidden" aria-label="Abrir menu"><Menu size={20}/></button>
      {open && <div className="absolute right-3 top-[78px] z-50 w-56 border border-cyan-500/30 bg-[#03121d]/95 p-2 shadow-2xl lg:hidden">{tabs.map((tab, i) => <button key={tab} onClick={() => {setActive(i);setOpen(false)}} className="block w-full px-3 py-2 text-left text-xs uppercase text-slate-300 hover:bg-cyan-400/10">{tab}</button>)}</div>}
      <Radio className="absolute bottom-2 left-[18%] hidden h-4 w-20 text-cyan-400/60 md:block" />
      <span className="absolute right-6 top-5 hidden h-14 w-14 rounded-full border border-dashed border-cyan-400/40 after:absolute after:inset-2 after:rounded-full after:border after:border-cyan-400/30 2xl:block" />
    </header>
  );
}
