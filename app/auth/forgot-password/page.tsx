'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ZodError } from 'zod';
import { authClient } from '../../../lib/supabase/auth';
import { resetPasswordSchema } from '../../../lib/validations/auth';
import { Alert } from '../../../components/ui/alert';
import { InputField } from '../../../components/ui/input-field';
import { Spinner } from '../../../components/ui/spinner';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const validateFormData = (): boolean => {
    setFieldError('');

    try {
      resetPasswordSchema.parse({ email });
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors[0]?.message || 'Email inválido';
        setFieldError(message);
        console.error('Validation error:', message);
        return false;
      }
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateFormData()) {
      console.warn('Form validation failed');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting password reset for email:', email);
      const validation = resetPasswordSchema.parse({ email });
      const { error: resetError } = await authClient.resetPassword(validation.email);

      if (resetError) {
        const errorMessage = resetError.message || 'Erro desconhecido ao enviar email';
        console.error('Reset password error:', {
          message: errorMessage,
          status: resetError.status,
          details: resetError,
        });
        setError(errorMessage);
        return;
      }

      console.log('Password reset email sent successfully');
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao enviar email de recuperação';
      console.error('Unexpected error during password reset:', {
        message: errorMessage,
        error: err,
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email enviado</h1>

            <p className="text-gray-600 mb-8">
              Verifique seu email para instruções de recuperação de senha.
            </p>

            <Link
              href="/auth/login"
              className="block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
          <p className="text-gray-600 mb-8">
            Informe seu email para receber instruções de recuperação
          </p>

          {error && (
            <div>
              <Alert
                type="error"
                message={error}
                onDismiss={() => setError(null)}
                dismissible={true}
              />
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="w-full mb-6 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Spinner size="sm" /> : null}
                {isLoading ? 'Tentando novamente...' : 'Tentar novamente'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (fieldError) {
                  setFieldError('');
                }
              }}
              error={fieldError}
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Spinner size="sm" /> : null}
              {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
