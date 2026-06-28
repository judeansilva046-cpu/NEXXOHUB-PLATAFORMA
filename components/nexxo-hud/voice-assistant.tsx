'use client';

import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

const bars = Array.from({length: 58}, (_,i) => 8 + Math.abs(Math.sin(i*.63))*34);
export function VoiceAssistant() {
  return (
    <section className="hud-panel relative overflow-hidden px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-cyan-200"><Mic size={13}/> Assistente de voz</div>
      <div className="mt-2 flex h-12 items-center justify-center gap-[3px]">{bars.map((height,i) => <motion.span key={i} className="w-[2px] rounded-full bg-gradient-to-t from-blue-500 to-emerald-300 shadow-[0_0_7px_#22d3ee]" animate={{height:[height*.35,height,height*.5]}} transition={{duration:.7+(i%5)*.1,repeat:Infinity,repeatType:'reverse',delay:i*.02}} />)}</div>
      <p className="text-center text-sm tracking-wide text-cyan-300 sm:text-base">Como posso ajudar hoje?</p>
    </section>
  );
}
