'use client';

import { motion } from 'framer-motion';

const particles = Array.from({length:42},(_,i)=>({x:(i*37)%100,y:(i*61)%100,size:i%4===0?2:1,duration:8+(i%7)}));
export function AnimatedParticles() {
  return <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><svg className="absolute inset-0 h-full w-full opacity-[.12]"><pattern id="dot-grid" width="42" height="42" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#22d3ee"/></pattern><rect width="100%" height="100%" fill="url(#dot-grid)"/></svg>{particles.map((p,i)=><motion.span key={i} className="absolute rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" style={{left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size}} animate={{y:[0,-35,0],opacity:[.1,.8,.1]}} transition={{duration:p.duration,repeat:Infinity,delay:(i%9)*.3}} />)}</div>;
}
