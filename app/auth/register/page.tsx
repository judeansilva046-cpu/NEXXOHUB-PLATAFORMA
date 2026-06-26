'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ZodError } from 'zod';
import { registerSchema } from '../../../lib/validations/auth';
import { authClient } from '../../../lib/supabase/auth';
import { Alert } from '../../../components/ui/alert';
import { InputField } from '../../../components/ui/input-field';
import { Spinner } from '../../../components/ui/spinner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: '',
    organizationCnpj: '',
  });

  const validateFormData = (): boolean => {
    setFieldErrors({});

    try {
      registerSchema.parse(formData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateFormData()) {
      console.warn('Form validation failed');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting registration with email:', formData.email);
      const validation = registerSchema.parse(formData);

      const { error: authError } = await authClient.signUp({
        email: validation.email,
        password: validation.password,
        fullName: validation.fullName,
        organizationName: validation.organizationName,
        organizationCnpj: validation.organizationCnpj,
      });

      if (authError) {
        const errorMessage = authError.message || 'Erro desconhecido ao registrar';
        console.error('Auth error:', {
          message: errorMessage,
          status: authError.status,
          details: authError,
        });
        setError(errorMessage);
        return;
      }

      console.log('Registration successful, redirecting to email verification');
      router.push('/auth/verify-email');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar';
      console.error('Unexpected error during registration:', {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">NexxoHub</h1>
          <p className="text-center text-gray-600 mb-8">Criar Conta</p>

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
              id="fullName"
              label="Nome Completo"
              type="text"
              placeholder="Seu nome"
              value={formData.fullName}
              onChange={(value) => {
                setFormData({ ...formData, fullName: value });
                if (fieldErrors.fullName) {
                  setFieldErrors({ ...fieldErrors, fullName: '' });
                }
              }}
              error={fieldErrors.fullName}
              required
              disabled={isLoading}
              minLength={2}
            />

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
              id="organizationName"
              label="Nome da Organização"
              type="text"
              placeholder="Nome da sua empresa"
              value={formData.organizationName}
              onChange={(value) => {
                setFormData({ ...formData, organizationName: value });
                if (fieldErrors.organizationName) {
                  setFieldErrors({ ...fieldErrors, organizationName: '' });
                }
              }}
              error={fieldErrors.organizationName}
              required
              disabled={isLoading}
              minLength={2}
            />

            <InputField
              id="organizationCnpj"
              label="CNPJ da Organização"
              type="text"
              placeholder="Somente 14 números"
              value={formData.organizationCnpj}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  organizationCnpj: value.replace(/\D/g, '').slice(0, 14),
                });
                if (fieldErrors.organizationCnpj) {
                  setFieldErrors({ ...fieldErrors, organizationCnpj: '' });
                }
              }}
              error={fieldErrors.organizationCnpj}
              required
              disabled={isLoading}
              minLength={14}
            />

            <InputField
              id="password"
              label="Senha"
              type="password"
              placeholder="12+ caracteres, maiúscula, número e símbolo"
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
              autoComplete="new-password"
              minLength={12}
            />

            <InputField
              id="confirmPassword"
              label="Confirmar Senha"
              type="password"
              placeholder="Confirme sua senha"
              value={formData.confirmPassword}
              onChange={(value) => {
                setFormData({ ...formData, confirmPassword: value });
                if (fieldErrors.confirmPassword) {
                  setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                }
              }}
              error={fieldErrors.confirmPassword}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Spinner size="sm" /> : null}
              {isLoading ? 'Registrando...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-700 font-medium transition"
            >
              Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
