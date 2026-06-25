'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ZodError } from 'zod';
import { loginSchema } from '../../../lib/validations/auth';
import { authClient } from '../../../lib/supabase/auth';
import { getAuthErrorMessage } from '../../../lib/auth-errors';
import { Alert } from '../../../components/ui/alert';
import { InputField } from '../../../components/ui/input-field';
import { Spinner } from '../../../components/ui/spinner';

type AuthMethod = 'email' | 'phone' | 'magic-link' | 'google' | 'github';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: '', password: '', phone: '' });
  const [phoneVerification, setPhoneVerification] = useState({
    step: 'send' as 'send' | 'verify',
    phone: '',
    token: '',
  });

  // ============================================================================
  // CHECK SESSION ON MOUNT (MIDDLEWARE WILL HANDLE REDIRECT)
  // ============================================================================
  // Nota: Remover useEffect aqui porque o middleware já cuida do redirect
  // de usuários autenticados que acessarem /auth/login

  // ============================================================================
  // EMAIL + SENHA
  // ============================================================================

  const validateFormData = (): boolean => {
    setFieldErrors({});

    try {
      loginSchema.parse(formData);
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          const path = error.path.join('.');
          errors[path] = error.message;
        });
        setFieldErrors(errors);
        console.error('Validation errors:', errors);
        return false;
      }
      return true;
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateFormData()) {
      console.warn('Form validation failed');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with email:', formData.email);
      const validation = loginSchema.parse(formData);

      const { data, error: authError } = await authClient.signIn(
        validation.email,
        validation.password
      );

      if (authError) {
        const errorMessage = getAuthErrorMessage(authError);
        console.error('Auth error:', {
          message: errorMessage,
          status: authError.status,
          details: authError,
        });
        setError(errorMessage);
        return;
      }

      if (data?.session) {
        console.log('[LOGIN_SUCCESS] User logged in', {
          userId: data.session.user?.id,
          email: data.session.user?.email,
        });

        // Aguarda a sessão ser persistida nos cookies
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('[SESSION_EXISTS] Verifying session persisted...');

        // Verifica se a sessão foi realmente criada no servidor
        try {
          const { data: sessionData } = await authClient.getSession();
          if (sessionData?.session) {
            console.log('[SESSION_EXISTS] Session confirmed on client');
            // Use router.replace para evitar loop
            // Isso substitui a entry do histórico, não empilha
            router.replace('/dashboard');
            // Force refresh para garantir que RLS funciona
            router.refresh();
          } else {
            const msg = 'Sessão não persistiu. Tente novamente.';
            console.error('[SESSION_EXISTS] ERROR:', msg);
            setError(msg);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao verificar sessão';
          console.error('[SESSION_EXISTS] ERROR:', msg);
          setError(msg);
        }
      } else {
        const msg = 'Login realizado, mas nenhuma sessão foi criada';
        console.error('[LOGIN_SUCCESS] ERROR:', msg);
        setError(msg);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      console.error('Unexpected error during login:', {
        message: errorMessage,
        error: err,
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // PHONE OTP
  // ============================================================================

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.phone || formData.phone.length < 10) {
      setError('Por favor, insira um número de celular válido');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending OTP to phone:', formData.phone);
      const { error: authError } = await authClient.signInWithPhone(formData.phone);

      if (authError) {
        const errorMessage = authError.message || 'Erro ao enviar código';
        console.error('Phone auth error:', errorMessage);
        setError(errorMessage);
        return;
      }

      setPhoneVerification({ step: 'verify', phone: formData.phone, token: '' });
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar código';
      console.error('Unexpected error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneVerification.token || phoneVerification.token.length < 6) {
      setError('Por favor, insira o código de verificação');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Verifying OTP for phone:', phoneVerification.phone);
      const { data, error: authError } = await authClient.verifyPhoneOtp(
        phoneVerification.phone,
        phoneVerification.token
      );

      if (authError) {
        const errorMessage = authError.message || 'Código inválido';
        console.error('OTP verification error:', errorMessage);
        setError(errorMessage);
        return;
      }

      if (data?.session) {
        console.log('[LOGIN_SUCCESS] Phone verification successful!');
        await new Promise((resolve) => setTimeout(resolve, 100));
        router.replace('/dashboard');
        router.refresh();
      } else {
        setError('Erro ao criar sessão');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar código';
      console.error('Unexpected error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // MAGIC LINK
  // ============================================================================

  const handleMagicLinkSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.email.includes('@')) {
      setError('Por favor, insira um email válido');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending magic link to:', formData.email);
      const { error: authError } = await authClient.signInWithMagicLink(formData.email);

      if (authError) {
        const errorMessage = authError.message || 'Erro ao enviar link';
        console.error('Magic link error:', errorMessage);
        setError(errorMessage);
        return;
      }

      setError(null);
      alert('✅ Link de acesso enviado! Verifique seu email.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar link';
      console.error('Unexpected error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // OAUTH - Google
  // ============================================================================

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('Signing in with Google');
      const { data, error: authError } = await authClient.signInWithGoogle();

      if (authError) {
        const errorMessage = getAuthErrorMessage(authError);
        console.error('Google auth error:', errorMessage);
        setError(errorMessage);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login com Google';
      console.error('Unexpected error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // ============================================================================
  // OAUTH - GitHub
  // ============================================================================

  const handleGitHubLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('Signing in with GitHub');
      const { data, error: authError } = await authClient.signInWithGitHub();

      if (authError) {
        const errorMessage = getAuthErrorMessage(authError);
        console.error('GitHub auth error:', errorMessage);
        setError(errorMessage);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login com GitHub';
      console.error('Unexpected error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 flex items-center justify-center px-4 py-8 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse"></div>
      <div className="absolute -bottom-8 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 -z-10"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* LEFT SIDE - BRANDING */}
        <div className="hidden lg:flex flex-col items-start justify-center text-white space-y-8">
          <div>
            <h2 className="text-5xl font-bold mb-4 leading-tight">NexxoHub</h2>
            <p className="text-xl text-purple-100">Plataforma de Gestão Psicossocial</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-400 bg-opacity-20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Avaliações Rápidas</h3>
                <p className="text-purple-100 text-sm">Diagnóstico psicossocial em tempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-400 bg-opacity-20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Relatórios Inteligentes</h3>
                <p className="text-purple-100 text-sm">Análises detalhadas e insights acionáveis</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-400 bg-opacity-20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gestão Centralizada</h3>
                <p className="text-purple-100 text-sm">Controle total da saúde corporativa</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-purple-300 border-opacity-30">
            <p className="text-sm text-purple-100">Versão 1.0.0 • Next.js 15 + React 19 + TypeScript</p>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="w-full">
          <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-10 border border-white border-opacity-20">
            {/* HEADER */}
            <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-2">Acessar Plataforma</h1>
            <p className="text-center text-gray-600 mb-8 text-sm">Bem-vindo de volta ao NexxoHub</p>

          {/* ERROR ALERT */}
          {error && (
            <Alert
              type="error"
              message={error}
              onDismiss={() => setError(null)}
              dismissible={true}
            />
          )}

          {/* AUTH METHOD TABS */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setAuthMethod('email');
                setError(null);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                authMethod === 'email'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => {
                setAuthMethod('phone');
                setError(null);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                authMethod === 'phone'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Celular
            </button>
            <button
              onClick={() => {
                setAuthMethod('magic-link');
                setError(null);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                authMethod === 'magic-link'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Link
            </button>
          </div>

          {/* EMAIL + SENHA */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <InputField
                id="email"
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(value) => {
                  setFormData({ ...formData, email: value });
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: '' });
                  }
                }}
                error={fieldErrors.email}
                required
                disabled={isLoading}
                autoComplete="email"
              />

              <InputField
                id="password"
                label="Senha"
                type="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={(value) => {
                  setFormData({ ...formData, password: value });
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: '' });
                  }
                }}
                error={fieldErrors.password}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? <Spinner size="sm" /> : null}
                {isLoading ? 'Conectando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* PHONE OTP */}
          {authMethod === 'phone' && (
            <form
              onSubmit={phoneVerification.step === 'send' ? handlePhoneSendOtp : handlePhoneVerifyOtp}
              className="space-y-4"
            >
              {phoneVerification.step === 'send' ? (
                <>
                  <InputField
                    id="phone"
                    label="Número de Celular"
                    type="tel"
                    placeholder="+55 (11) 99999-9999"
                    value={formData.phone}
                    onChange={(value) => setFormData({ ...formData, phone: value })}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isLoading ? <Spinner size="sm" /> : null}
                    {isLoading ? 'Enviando...' : 'Enviar Código'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Código enviado para: <strong>{phoneVerification.phone}</strong>
                  </p>
                  <InputField
                    id="token"
                    label="Código de Verificação"
                    type="text"
                    placeholder="123456"
                    value={phoneVerification.token}
                    onChange={(value) =>
                      setPhoneVerification({ ...phoneVerification, token: value })
                    }
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isLoading ? <Spinner size="sm" /> : null}
                    {isLoading ? 'Verificando...' : 'Verificar Código'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneVerification({ step: 'send', phone: '', token: '' })}
                    className="w-full text-blue-600 hover:text-blue-700 font-medium py-2"
                  >
                    Usar outro número
                  </button>
                </>
              )}
            </form>
          )}

          {/* MAGIC LINK */}
          {authMethod === 'magic-link' && (
            <form onSubmit={handleMagicLinkSend} className="space-y-4">
              <InputField
                id="email"
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                required
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600">
                Vamos enviar um link de acesso para seu email. Sem necessidade de senha!
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? <Spinner size="sm" /> : null}
                {isLoading ? 'Enviando...' : 'Enviar Link'}
              </button>
            </form>
          )}

          {/* DIVIDER */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">Ou continue com</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* OAUTH BUTTONS */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

            {/* FOOTER LINKS */}
            <div className="mt-6 space-y-2 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-cyan-400 hover:text-cyan-300 block transition font-medium"
              >
                Esqueceu a senha?
              </Link>
              <div className="text-sm text-gray-600">
                Não tem conta?{' '}
                <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
