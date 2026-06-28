'use client';

import { motion } from 'framer-motion';
import { Bell, CalendarDays, CircleDollarSign, FileChartColumn, FolderKanban, Globe2, LayoutDashboard, Mail, MessageCircle, ShieldCheck, UserRound, Users2 } from 'lucide-react';

const actions = [{label:'Dashboard',icon:LayoutDashboard},{label:'Projetos',icon:FolderKanban},{label:'Clientes',icon:UserRound},{label:'Financeiro',icon:CircleDollarSign},{label:'Tarefas',icon:FileChartColumn},{label:'Relatórios',icon:FileChartColumn}];
export function BottomActions() {
  const dock = [LayoutDashboard, Globe2, MessageCircle, CalendarDays, Mail, Bell, ShieldCheck, Users2];
  return <><nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Ações rápidas">{actions.map(({label,icon:Icon})=><motion.button key={label} whileHover={{y:-4,scale:1.02}} whileTap={{scale:.98}} className="hud-panel group flex min-h-20 flex-col items-center justify-center gap-2 px-2 py-3 text-[9px] uppercase tracking-wider text-slate-300 transition hover:border-cyan-300/60 hover:text-white hover:shadow-[0_0_25px_rgba(6,182,212,.16)]"><Icon className="text-cyan-400 transition group-hover:text-blue-300 group-hover:drop-shadow-[0_0_8px_#22d3ee]" size={23}/>{label}</motion.button>)}</nav><nav className="hud-panel flex items-center justify-around px-3 py-3" aria-label="Menu inferior">{dock.map((Icon,i)=><button key={i} className="p-2 text-cyan-400 hover:text-white"><Icon size={19}/></button>)}</nav></>;
}
