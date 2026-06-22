'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams?.get('email') || 'your email';

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

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Não recebeu o email?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Reenviar
              </button>
            </p>

            <Link
              href="/auth/login"
              className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
