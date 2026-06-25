'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para dashboard se autenticado, caso contrário para login
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          // Usuário autenticado - ir para dashboard
          router.replace('/dashboard');
        } else {
          // Não autenticado - ir para login
          router.replace('/auth/login');
        }
      } catch (err) {
        // Erro ao verificar - ir para login
        router.replace('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">NexxoHub</h1>
        <p className="text-gray-600 mb-8">Plataforma SaaS Multi-Tenant em Desenvolvimento</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Carregando...</p>
      </div>
    </div>
  );
}
