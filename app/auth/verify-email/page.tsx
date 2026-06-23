'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || 'seu email';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendEmail = async () => {
    if (!email || email === 'seu email') {
      setResendMessage({ type: 'error', text: 'Email não encontrado. Por favor, registre-se novamente.' });
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resendEmailConfirmationLink(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      });

      if (error) {
        setResendMessage({ type: 'error', text: error.message || 'Erro ao reenviar email' });
      } else {
        setResendMessage({ type: 'success', text: 'Email de confirmação reenviado! Verifique sua caixa de entrada.' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao reenviar email';
      setResendMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifique seu email
          </h1>

          <p className="text-gray-600 mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>
          </p>

          <p className="text-sm text-gray-500 mb-8">
            Clique no link no email para confirmar sua conta e começar a usar a NexxoHub.
          </p>

          {resendMessage && (
            <div className={`mb-6 p-3 rounded-md ${
              resendMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <p className="text-sm">{resendMessage.text}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Não recebeu o email?{' '}
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Reenviando...' : 'Reenviar'}
              </button>
            </p>

            <Link href="/auth/login" className="block text-sm text-blue-600 hover:text-blue-700 font-medium">
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}