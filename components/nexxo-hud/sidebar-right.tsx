'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Cpu, DatabaseZap, ExternalLink, HardDrive, Network, Play, ShieldCheck, SkipBack, SkipForward } from 'lucide-react';
import { HudPanel } from './panel';

const diagnostics = [
  {label:'CPU', value:23, icon:Cpu}, {label:'Memória', value:45, icon:DatabaseZap},
  {label:'Armazenamento', value:62, icon:HardDrive}, {label:'Rede', value:18, icon:Network}, {label:'Segurança', value:100, icon:ShieldCheck},
];
const feed = ['Novo projeto criado','Pagamento recebido','Tarefa concluída','Backup realizado','Novo usuário cadastrado'];

export function SidebarRight() {
  return (
    <aside className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
      <HudPanel title="Diagnósticos do sistema" className="md:col-span-2 xl:col-span-1">
        <div className="space-y-4">{diagnostics.map(({label,value,icon:Icon},i) => <div key={label} className="grid grid-cols-[30px_1fr_38px] items-center gap-2"><span className="rounded-full border border-cyan-400/30 p-1.5 text-cyan-300"><Icon size={15}/></span><div><div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-slate-400"><span>{label}</span></div><div className="h-1 overflow-hidden bg-cyan-950"><motion.div initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:1.5,delay:i*.15}} className="h-full bg-gradient-to-r from-blue-500 via-cyan-300 to-emerald-300 shadow-[0_0_8px_#22d3ee]"/></div></div><b className="font-mono text-xs text-cyan-200">{value}%</b></div>)}</div>
        <div className="mt-5 flex items-end justify-between border-t border-cyan-400/10 pt-4"><div><p className="text-[9px] uppercase tracking-widest text-slate-500">Status geral</p><strong className="text-xl font-light uppercase tracking-wider text-emerald-300">Excelente</strong></div><Network className="h-10 w-10 text-cyan-400/50"/></div>
      </HudPanel>
      <HudPanel title="Atividades em tempo real">
        <div className="space-y-2">{feed.map((item,i)=><motion.div key={item} animate={{opacity:[.55,1,.55]}} transition={{duration:3,delay:i*.5,repeat:Infinity}} className="flex items-center gap-3 border-b border-cyan-400/[.07] py-2 text-[11px] text-slate-300"><span className="relative h-2 w-2 rounded-full bg-emerald-400"><span className="absolute inset-0 animate-ping rounded-full bg-emerald-400"/></span><span className="flex-1">{item}</span><time className="font-mono text-[9px] text-cyan-500">agora</time></motion.div>)}</div>
      </HudPanel>
      <HudPanel title="Alertas" className="!border-red-500/45">
        <div className="space-y-2 text-[10px] text-slate-300"><p className="flex gap-2"><AlertTriangle size={14} className="text-red-500"/>Uso de armazenamento em 85%</p><p className="flex gap-2"><AlertTriangle size={14} className="text-red-500"/>1 alerta de segurança não lido</p></div>
        <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[.14em] text-red-400"><Bell size={12}/> Ver alertas</div>
      </HudPanel>
      <HudPanel title="Música" className="md:col-span-2 xl:col-span-1">
        <a
          href="https://music.youtube.com/search?q=The%20Weeknd%20Blinding%20Lights"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded border border-transparent p-1 transition hover:border-red-500/30 hover:bg-red-500/[.05]"
          aria-label="Abrir Blinding Lights no YouTube Music"
        >
          <div className="relative grid h-11 w-11 place-items-center rounded bg-gradient-to-br from-red-500 to-red-950 text-white shadow-[0_0_15px_rgba(239,68,68,.25)]">
            <Play size={18} fill="currentColor"/>
            <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_7px_#34d399]" />
          </div>
          <div className="min-w-0 flex-1 text-[11px]"><b className="font-medium text-slate-100">The Weeknd</b><p className="truncate text-slate-400">Blinding Lights</p><span className="text-[8px] uppercase tracking-wider text-red-400">Ouvir no YouTube Music</span></div>
          <SkipBack size={14} className="text-cyan-300/60"/>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-red-400/40 text-red-300 transition group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white"><Play size={12} fill="currentColor"/></span>
          <SkipForward size={14} className="text-cyan-300/60"/>
          <ExternalLink size={12} className="text-slate-500 group-hover:text-red-300"/>
        </a>
      </HudPanel>
    </aside>
  );
}
