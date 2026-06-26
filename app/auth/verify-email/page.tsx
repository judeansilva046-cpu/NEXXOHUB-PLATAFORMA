'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase/auth';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleResendEmail = async () => {
    const email = window.sessionStorage.getItem('nexxohub.pendingEmail');
    if (!email) {
      setResendMessage({
        type: 'error',
        text: 'Entre novamente para solicitar outro email.',
      });
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      setResendMessage(
        error
          ? { type: 'error', text: 'Não foi possível reenviar o email.' }
          : {
              type: 'success',
              text: 'Email de confirmação reenviado. Verifique sua caixa de entrada.',
            }
      );
    } catch {
      setResendMessage({
        type: 'error',
        text: 'Não foi possível reenviar o email.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <section className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl text-green-600" aria-hidden>
            ✓
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Verifique seu email</h1>
        <p className="mb-6 text-gray-600">
          Enviamos um link de confirmação para o endereço informado no cadastro.
        </p>
        <p className="mb-8 text-sm text-gray-500">
          Clique no link recebido para confirmar sua conta e acessar a NexxoHub.
        </p>

        {resendMessage && (
          <div
            className={`mb-6 rounded-md border p-3 ${
              resendMessage.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <p className="text-sm">{resendMessage.text}</p>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Não recebeu o email?{' '}
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {isResending ? 'Reenviando...' : 'Reenviar'}
          </button>
        </p>

        <Link
          href="/auth/login"
          className="mt-4 block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Voltar para login
        </Link>
      </section>
    </main>
  );
}
