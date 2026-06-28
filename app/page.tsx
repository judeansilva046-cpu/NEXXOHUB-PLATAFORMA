'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AnimatedParticles } from '@/components/nexxo-hud/animated-particles';
import { BottomActions } from '@/components/nexxo-hud/bottom-actions';
import { Header } from '@/components/nexxo-hud/header';
import { MainHud } from '@/components/nexxo-hud/main-hud';
import { SidebarLeft } from '@/components/nexxo-hud/sidebar-left';
import { SidebarRight } from '@/components/nexxo-hud/sidebar-right';
import { VoiceAssistant } from '@/components/nexxo-hud/voice-assistant';

export default function HomePage() {
  const [desktopScale, setDesktopScale] = useState(1);

  useEffect(() => {
    const fitDashboard = () => {
      if (window.innerWidth < 1280) {
        setDesktopScale(1);
        return;
      }
      // O cockpit completo foi desenhado para uma área útil de aproximadamente
      // 1040px. Em notebooks, reduzimos tudo proporcionalmente para caber sem rolagem.
      setDesktopScale(Math.min(1, window.innerHeight / 1040));
    };
    fitDashboard();
    window.addEventListener('resize', fitDashboard);
    return () => window.removeEventListener('resize', fitDashboard);
  }, []);

  return (
    <main className="hud-shell min-h-screen overflow-x-hidden text-slate-100 xl:h-screen xl:overflow-hidden">
      <AnimatedParticles />
      <div className="scanline" />
      <div
        className="relative z-10 origin-top-left"
        style={{
          transform: `scale(${desktopScale})`,
          width: desktopScale < 1 ? `${100 / desktopScale}%` : '100%',
        }}
      >
        <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col p-3 sm:p-4 lg:p-5">
          <Header />
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-4 grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[310px_minmax(500px,1fr)_330px]"
          >
            <SidebarLeft />
            <section className="order-first flex min-w-0 flex-col gap-4 xl:order-none">
              <MainHud />
              <VoiceAssistant />
              <BottomActions />
            </section>
            <SidebarRight />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
