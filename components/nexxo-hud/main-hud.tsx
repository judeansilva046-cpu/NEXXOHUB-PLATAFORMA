'use client';

import { motion } from 'framer-motion';

export function MainHud() {
  return (
    <section className="hud-panel relative flex min-h-[470px] flex-1 items-center justify-center overflow-hidden sm:min-h-[560px]">
      <div className="absolute inset-0 hud-grid opacity-40" />
      <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent" />
      <motion.div animate={{rotate:360}} transition={{duration:48,repeat:Infinity,ease:'linear'}} className="hud-ring absolute h-[82vw] max-h-[540px] w-[82vw] max-w-[540px] rounded-full border-2 border-cyan-400/35" />
      <motion.div animate={{rotate:-360}} transition={{duration:34,repeat:Infinity,ease:'linear'}} className="hud-ring hud-ring-dashed absolute h-[68vw] max-h-[440px] w-[68vw] max-w-[440px] rounded-full border-2 border-dashed border-cyan-300/45" />
      <motion.div animate={{rotate:360}} transition={{duration:18,repeat:Infinity,ease:'linear'}} className="absolute h-[54vw] max-h-[350px] w-[54vw] max-w-[350px] rounded-full border-2 border-cyan-400/70 shadow-[0_0_45px_rgba(0,153,255,.28),inset_0_0_40px_rgba(0,153,255,.16)] before:absolute before:-inset-3 before:rounded-full before:border before:border-blue-400/30" />
      {[0,60,120,180,240,300].map((degree) => <motion.span key={degree} className="absolute h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" style={{transform:`rotate(${degree}deg) translateY(-205px)`}} animate={{opacity:[.2,1,.2]}} transition={{duration:2,delay:degree/180,repeat:Infinity}} />)}
      <motion.div initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:1}} className="relative z-10 flex flex-col items-center rounded-full bg-[#03111b]/80 px-10 py-10 text-center shadow-[0_0_60px_rgba(6,182,212,.12)]">
        <h1 className="text-4xl font-semibold tracking-[.04em] sm:text-5xl">NEXXOHUB</h1>
        <p className="mt-2 text-sm uppercase tracking-[.12em] text-cyan-300 sm:text-base">Centro de comando<br/>inteligente</p>
      </motion.div>
      <span className="absolute bottom-5 left-5 font-mono text-[9px] leading-4 text-cyan-400/50">NEXXO CORE 4.8.2<br/>LATENCY 12MS<br/>ENCRYPTION AES-256</span>
    </section>
  );
}
