'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { authClient } from '@/lib/supabase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const validation = loginSchema.parse(formData);
      const { data, error: authError } = await authClient.signIn(
        validation.email,
        validation.password
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data?.session) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            NexxoHub
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Gestão Psicossocial Corporativa
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Conectando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 block"
            >
              Esqueceu a senha?
            </Link>
            <div className="text-sm text-gray-600">
              Não tem conta?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Registre-se
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
