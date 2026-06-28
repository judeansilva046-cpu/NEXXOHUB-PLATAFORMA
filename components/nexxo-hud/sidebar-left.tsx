'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Activity, CloudRain, CloudUpload, Database, Gauge, LocateFixed, LockKeyhole, Rocket, Server } from 'lucide-react';
import { HudPanel } from './panel';

const stats = [
  { label: 'Energia do servidor', value: '100%', icon: Gauge },
  { label: 'Banco de dados', value: 'ONLINE', icon: Database },
  { label: 'API Gateway', value: 'ONLINE', icon: Rocket },
  { label: 'Serviços', value: 'ONLINE', icon: Server },
  { label: 'Segurança', value: 'ONLINE', icon: LockKeyhole },
  { label: 'Backup', value: 'ONLINE', icon: CloudUpload },
];

const liveCities = [
  { name: 'NEW YORK', language: 'English', left: 24, top: 48 },
  { name: 'LONDON', language: 'English', left: 51, top: 37 },
  { name: 'SÃO PAULO', language: 'Português', left: 35, top: 73 },
  { name: 'DUBAI', language: 'Arabic', left: 69, top: 55 },
  { name: 'TOKYO', language: 'Japanese', left: 87, top: 47 },
];

export function SidebarLeft() {
  const [location, setLocation] = useState({ latitude: -23.5505, longitude: -46.6333, accuracy: 0 });
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'active' | 'denied'>('idle');
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const [activeCity, setActiveCity] = useState(liveCities[2]);
  const watchId = useRef<number>();

  const startLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
        setUpdatedAt(new Date());
        setLocationStatus('active');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  useEffect(() => () => {
    if (watchId.current !== undefined) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  return (
    <aside className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
      <HudPanel title="Resumo do sistema" className="md:col-span-2 xl:col-span-1">
        <div className="space-y-1">{stats.map(({label,value,icon:Icon}, i) => <motion.div key={label} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:.1*i}} className="group flex items-center gap-3 border-b border-cyan-400/[.07] px-1 py-2.5 last:border-0"><span className="rounded-full border border-cyan-400/30 p-2 text-cyan-300 group-hover:shadow-[0_0_16px_rgba(34,211,238,.35)]"><Icon size={15}/></span><span className="flex-1 text-[11px] uppercase tracking-wide text-slate-400">{label}</span><strong className="font-mono text-sm font-medium text-emerald-300">{value}</strong></motion.div>)}</div>
      </HudPanel>
      <HudPanel title="Localização global">
        <div className="group relative h-52 overflow-hidden rounded border border-cyan-400/25 bg-[#02081a] shadow-[inset_0_0_35px_rgba(8,145,178,.2)]">
          <motion.div className="absolute -inset-3" animate={{ scale: [1, 1.06, 1], x: [-2, 3, -2], y: [1, -2, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
            <Image src="/nexxohub-live-globe.png" alt="Globo inteligente com conexões globais" fill sizes="(min-width: 1280px) 310px, (min-width: 768px) 50vw, 100vw" className="object-cover object-[center_43%] opacity-90" />
          </motion.div>
          <motion.div className="pointer-events-none absolute left-[8%] top-[22%] h-[60%] w-[84%] rounded-[50%] border border-dashed border-cyan-300/50" animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="pointer-events-none absolute left-[17%] top-[15%] h-[72%] w-[66%] rounded-[50%] border border-blue-400/30" animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(1,6,18,.28)_76%,rgba(1,6,18,.82)_100%)]" />
          {liveCities.map((city, index) => (
            <button key={city.name} onClick={() => setActiveCity(city)} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${city.left}%`, top: `${city.top}%` }} aria-label={`Selecionar ${city.name}`}>
              <motion.span animate={{ scale: [0.75, 1.3, 0.75], opacity: [.65, 1, .65] }} transition={{ duration: 1.7, repeat: Infinity, delay: index * .22 }} className={`block h-2 w-2 rounded-full ${activeCity.name === city.name ? 'bg-rose-400 shadow-[0_0_12px_5px_rgba(251,113,133,.75)]' : 'bg-cyan-300 shadow-[0_0_9px_3px_rgba(34,211,238,.6)]'}`} />
            </button>
          ))}
          <motion.div key={activeCity.name} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute left-2 top-2 z-20 rounded border border-cyan-400/40 bg-[#02091a]/90 px-2 py-1 text-[8px] backdrop-blur">
            <b className="tracking-wider text-cyan-100">{activeCity.name}</b><span className="ml-2 text-cyan-400">{activeCity.language}</span>
          </motion.div>
          {locationStatus === 'active' && <motion.span className="absolute left-[35%] top-[73%] z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-emerald-300 shadow-[0_0_14px_4px_rgba(52,211,153,.85)]" animate={{ scale: [.8, 1.35, .8] }} transition={{ duration: 1.5, repeat: Infinity }}><span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-emerald-300/80" /></motion.span>}
          <button onClick={startLocation} disabled={locationStatus === 'locating'} className="absolute right-2 top-2 flex items-center gap-1.5 rounded border border-cyan-400/30 bg-[#03131f]/90 px-2 py-1.5 text-[8px] uppercase tracking-wider text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50">
            <LocateFixed size={12} className={locationStatus === 'locating' ? 'animate-spin' : ''}/>{locationStatus === 'active' ? 'GPS ativo' : locationStatus === 'locating' ? 'Localizando' : 'Ativar GPS'}
          </button>
          <div className="absolute bottom-2 left-2 z-20 rounded bg-[#020c14]/85 px-2 py-1 text-[9px] font-mono text-cyan-100 backdrop-blur-sm">
            {Math.abs(location.latitude).toFixed(5)}° {location.latitude >= 0 ? 'N' : 'S'} · {Math.abs(location.longitude).toFixed(5)}° {location.longitude >= 0 ? 'E' : 'W'}
            <br/><span className={locationStatus === 'active' ? 'text-emerald-300' : locationStatus === 'denied' ? 'text-red-400' : 'text-slate-400'}>{locationStatus === 'active' ? `Tempo real · precisão ${Math.round(location.accuracy)} m${updatedAt ? ` · ${updatedAt.toLocaleTimeString('pt-BR')}` : ''}` : locationStatus === 'denied' ? 'Permissão de localização necessária' : 'São Paulo · posição inicial'}</span>
          </div>
        </div>
      </HudPanel>
      <HudPanel title="Clima local">
        <div className="flex items-center gap-4"><CloudRain className="h-12 w-12 text-cyan-300 drop-shadow-[0_0_10px_#22d3ee]"/><div><strong className="font-mono text-3xl font-light">18°C</strong><p className="text-[10px] uppercase tracking-widest text-slate-400">Nublado</p></div></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px] uppercase text-slate-400"><span>Umidade<br/><b className="text-cyan-200">72%</b></span><span>Vento<br/><b className="text-cyan-200">12 km/h</b></span><span>Rede<br/><b className="text-emerald-300">Estável</b></span></div>
      </HudPanel>
      <div className="hidden items-center gap-2 text-[9px] uppercase tracking-widest text-cyan-400/50 xl:flex"><Activity size={13}/> Sincronização contínua ativa</div>
    </aside>
  );
}
