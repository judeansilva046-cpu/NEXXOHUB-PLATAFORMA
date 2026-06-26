'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  SlidersHorizontal,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { ZodError } from 'zod';
import { Spinner } from '../../../components/ui/spinner';
import { getAuthErrorMessage } from '../../../lib/auth-errors';
import { authClient } from '../../../lib/supabase/auth';
import { loginSchema } from '../../../lib/validations/auth';
import { portalConfig, type PortalType } from '../../../lib/portal';

type FieldErrors = Record<string, string>;

const features = [
  {
    title: 'Avaliações Rápidas',
    description: 'Diagnóstico psicossocial em tempo real',
    icon: Zap,
  },
  {
    title: 'Relatórios Inteligentes',
    description: 'Análises detalhadas e insights acionáveis',
    icon: BarChart3,
  },
  {
    title: 'Gestão Centralizada',
    description: 'Controle total da saúde corporativa',
    icon: SlidersHorizontal,
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <svg
        aria-hidden="true"
        className={compact ? 'h-12 w-12' : 'h-[86px] w-[86px]'}
        viewBox="0 0 88 88"
        fill="none"
      >
        <defs>
          <linearGradient id={`brand-gradient-${compact}`} x1="8" y1="78" x2="80" y2="8">
            <stop stopColor="#123BFF" />
            <stop offset=".56" stopColor="#168BFF" />
            <stop offset="1" stopColor="#1DE0DE" />
          </linearGradient>
          <filter id={`brand-glow-${compact}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M14 70V18L44 44L72 19V70L45 47L14 70Z"
          stroke={`url(#brand-gradient-${compact})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#brand-glow-${compact})`}
        />
        <circle cx="14" cy="18" r="9" fill="#2AB9FF" />
        <circle cx="14" cy="70" r="10" fill="#123BFF" />
        <circle cx="33" cy="47" r="8" fill="#1765FF" />
        <circle cx="72" cy="18" r="10" fill="#16D2D2" />
        <circle cx="72" cy="70" r="10" fill="#1649FF" />
        <circle cx="14" cy="18" r="3" fill="white" />
      </svg>

      <div>
        <div
          className={`font-semibold tracking-[-0.045em] text-white ${
            compact ? 'text-3xl' : 'text-[54px] leading-none'
          }`}
        >
          Nexxo
          <span className="bg-gradient-to-r from-[#0aa5ff] to-[#12d9ce] bg-clip-text text-transparent">
            Hub
          </span>
        </div>
        {!compact && (
          <p className="mt-3 text-[18px] tracking-wide text-slate-300">
            Plataforma de Gestão Psicossocial
          </p>
        )}
      </div>
    </div>
  );
}

function BackgroundArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_34%,rgba(8,70,158,0.14),transparent_29%),radial-gradient(circle_at_88%_60%,rgba(0,195,255,0.12),transparent_31%)]" />

      <svg
        className="absolute bottom-0 left-0 h-[45%] w-full opacity-75"
        viewBox="0 0 1536 470"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-line" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#0b46ff" stopOpacity=".1" />
            <stop offset=".45" stopColor="#1687ff" stopOpacity=".95" />
            <stop offset="1" stopColor="#00d9ff" stopOpacity=".55" />
          </linearGradient>
          <pattern id="wave-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.15" fill="#148cff" />
          </pattern>
          <filter id="wave-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="wave-clip">
            <path d="M0 155C180 130 245 303 473 281C705 259 803 73 1015 148C1180 206 1268 339 1536 202V470H0Z" />
          </clipPath>
        </defs>
        <rect
          width="1536"
          height="470"
          fill="url(#wave-dots)"
          clipPath="url(#wave-clip)"
          opacity=".82"
        />
        <path
          d="M0 155C180 130 245 303 473 281C705 259 803 73 1015 148C1180 206 1268 339 1536 202"
          stroke="url(#wave-line)"
          strokeWidth="2"
          fill="none"
          filter="url(#wave-glow)"
        />
        <path
          d="M0 178C186 152 252 323 486 301C713 280 817 96 1028 169C1197 228 1287 358 1536 226"
          stroke="#087eff"
          strokeOpacity=".42"
          fill="none"
        />
      </svg>

      <svg className="absolute right-0 top-[12%] h-[62%] w-[28%] opacity-70" viewBox="0 0 430 650">
        <g stroke="#1166e9" strokeWidth="1" opacity=".55">
          <path d="M70 108L176 62L258 144L348 74L420 164" />
          <path d="M24 238L130 182L258 144L334 248L420 164" />
          <path d="M24 238L110 344L218 292L334 248L398 366" />
          <path d="M110 344L78 470L218 430L218 292L310 404L398 366" />
          <path d="M78 470L172 572L296 526L218 430L398 366" />
          <path d="M176 62L130 182L110 344M258 144L218 292L310 404L296 526" />
        </g>
        {[
          [70, 108, 5],
          [176, 62, 7],
          [258, 144, 5],
          [348, 74, 6],
          [420, 164, 4],
          [24, 238, 5],
          [130, 182, 4],
          [334, 248, 6],
          [110, 344, 5],
          [218, 292, 7],
          [398, 366, 5],
          [78, 470, 4],
          [218, 430, 6],
          [310, 404, 4],
          [172, 572, 5],
          [296, 526, 6],
        ].map(([cx, cy, r], index) => (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={r}
            fill={index % 3 === 0 ? '#06d9ff' : '#1265ff'}
          />
        ))}
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    setFieldErrors({});

    try {
      loginSchema.parse(formData);
      return true;
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        const errors: FieldErrors = {};
        validationError.errors.forEach((item) => {
          errors[item.path.join('.')] = item.message;
        });
        setFieldErrors(errors);
        return false;
      }
      return true;
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const validation = loginSchema.parse(formData);
      const { data, error: authError } = await authClient.signIn(
        validation.email,
        validation.password
      );

      if (authError) {
        setError(getAuthErrorMessage(authError));
        return;
      }

      if (!data?.session) {
        setError('Login realizado, mas nenhuma sessão foi criada.');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      const { data: sessionData } = await authClient.getSession();

      if (!sessionData?.session) {
        setError('A sessão não foi persistida. Tente novamente.');
        return;
      }

      const requestedPortal = (new URLSearchParams(window.location.search).get('portal') ||
        'nexxohub') as PortalType;
      router.replace(portalConfig[requestedPortal]?.home || '/dashboard');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: authError } = await authClient.signInWithGoogle();

      if (authError) {
        setError(getAuthErrorMessage(authError));
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      setError('Não foi possível iniciar o acesso com Google.');
      setIsLoading(false);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Erro ao fazer login com Google.'
      );
      setIsLoading(false);
    }
  };

  const updateField = (field: 'email' | 'password', value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    if (error) setError(null);
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#010817] text-white">
      <BackgroundArtwork />
      <div className="pointer-events-none absolute inset-[1px] z-20 rounded-[18px] border border-white/45" />

      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-[1360px] items-center gap-10 px-5 py-10 sm:px-10 lg:grid-cols-[1fr_0.92fr] lg:px-16 xl:gap-20">
        <section className="hidden max-w-[570px] lg:block">
          <BrandMark />
          <div className="mt-10 h-px w-full bg-gradient-to-r from-cyan-400/25 to-transparent" />

          <div className="mt-2">
            {features.map(({ title, description, icon: Icon }, index) => (
              <div
                key={title}
                className={`flex items-center gap-7 py-8 ${
                  index < features.length - 1
                    ? 'border-b border-gradient-to-r border-cyan-300/15'
                    : ''
                }`}
              >
                <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-[#03152d]/80 shadow-[inset_0_0_24px_rgba(0,124,255,0.13),0_0_30px_rgba(0,128,255,0.08)]">
                  <Icon className="h-10 w-10 text-[#13c8ff]" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[21px] font-semibold text-slate-50">{title}</h2>
                  <p className="mt-2 text-[16px] leading-relaxed text-slate-300">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[565px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark compact />
          </div>

          <div className="rounded-[26px] bg-gradient-to-br from-[#168eff] via-[#00b6e7] to-[#13d2b4] p-px shadow-[0_24px_100px_rgba(0,41,105,0.45),0_0_35px_rgba(0,161,255,0.1)]">
            <div className="rounded-[25px] bg-[linear-gradient(145deg,rgba(2,15,39,0.98),rgba(1,12,31,0.96))] px-6 py-8 backdrop-blur-xl sm:px-12 sm:py-10">
              <div className="text-center">
                <UserRound
                  className="mx-auto h-12 w-12 text-[#12d5df]"
                  strokeWidth={1.45}
                  aria-hidden="true"
                />
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[29px]">
                  Acessar Plataforma
                </h1>
                <p className="mt-2 text-[16px] text-slate-300">
                  Bem-vindo de volta ao <span className="text-[#12d5df]">NexxoHub</span>
                </p>
              </div>

              <div className="my-9 flex items-center">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-500/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_#00eaff]" />
                <div className="h-px flex-1 bg-gradient-to-r from-slate-500/40 to-transparent" />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                >
                  <span className="flex-1">{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="rounded text-red-200 transition hover:text-white"
                    aria-label="Fechar mensagem de erro"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6" noValidate>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2.5 block text-sm font-medium text-slate-100"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.6}
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      disabled={isLoading}
                      placeholder="seu@email.com"
                      className={`h-[58px] w-full rounded-xl border bg-[#030d21]/75 pl-14 pr-4 text-[16px] text-white outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                        fieldErrors.email
                          ? 'border-red-400/75 focus:border-red-300'
                          : 'border-slate-500/45 focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(0,216,255,0.1)]'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-2 text-xs text-red-300">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2.5 block text-sm font-medium text-slate-100"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.6}
                    />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={(event) => updateField('password', event.target.value)}
                      disabled={isLoading}
                      placeholder="Sua senha"
                      className={`h-[58px] w-full rounded-xl border bg-[#030d21]/75 pl-14 pr-14 text-[16px] text-white outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                        fieldErrors.password
                          ? 'border-red-400/75 focus:border-red-300'
                          : 'border-slate-500/45 focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(0,216,255,0.1)]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" strokeWidth={1.6} />
                      ) : (
                        <Eye className="h-5 w-5" strokeWidth={1.6} />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-2 text-xs text-red-300">{fieldErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#114eff] via-[#1188f4] to-[#0dc7cf] text-[18px] font-semibold text-white shadow-[0_10px_30px_rgba(0,100,255,0.25)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:ring-offset-2 focus:ring-offset-[#020d22] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && <Spinner size="sm" />}
                  {isLoading ? 'Conectando...' : 'Entrar'}
                </button>
              </form>

              <div className="my-8 flex items-center gap-5">
                <div className="h-px flex-1 bg-slate-500/30" />
                <span className="text-sm text-slate-300">Ou continue com</span>
                <div className="h-px flex-1 bg-slate-500/30" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex h-[58px] w-full items-center justify-center gap-3 rounded-xl border border-slate-500/45 bg-[#020c20]/60 text-[17px] font-medium text-slate-50 transition hover:border-cyan-400/70 hover:bg-cyan-400/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.74 2.98-4.31 2.98-7.35Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.03.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.4 13.91A6 6 0 0 1 6.08 12c0-.66.12-1.3.32-1.91V7.51H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.49l3.34-2.58Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.97c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.94 5.51l3.34 2.58c.79-2.36 3-4.12 5.6-4.12Z"
                  />
                </svg>
                Google
              </button>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
                <Link href="/auth/forgot-password" className="transition hover:text-cyan-300">
                  Esqueceu a senha?
                </Link>
                <span className="hidden h-3 w-px bg-slate-600 sm:block" />
                <Link href="/auth/register" className="transition hover:text-cyan-300">
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
