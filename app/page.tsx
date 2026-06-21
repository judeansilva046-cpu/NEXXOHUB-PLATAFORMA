'use client';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-blue-900 mb-4">NexxoHub</h1>
        <p className="text-xl text-blue-700 mb-8">Plataforma SaaS Multi-Tenant em Desenvolvimento</p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-gray-600 mb-4">Bem-vindo ao NexxoHub Platform</p>
          <p className="text-sm text-gray-500">Versão 1.0.0 | Next.js 15 + React 19 + TypeScript</p>
        </div>
      </div>
    </main>
  );
}
