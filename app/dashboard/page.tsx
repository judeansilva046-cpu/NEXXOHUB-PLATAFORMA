'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Organization, User } from '@/types';

export default function DashboardPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const userData = await userRes.json();
        setUser(userData.data);

        // Fetch organization
        const orgRes = await fetch('/api/organizations');
        if (!orgRes.ok) throw new Error('Failed to fetch organization');
        const orgData = await orgRes.json();
        setOrganization(orgData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bem-vindo ao NexxoHub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Organização</CardTitle>
            <CardDescription>Sua organização atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {organization?.name || '-'}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              CNPJ: {organization?.cnpj || '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usuário</CardTitle>
            <CardDescription>Seu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {user?.full_name || '-'}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Função: {user?.role || '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <CardDescription>Seu contato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 truncate">
              {user?.email || '-'}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Último acesso: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Principais</CardTitle>
          <CardDescription>Navegue pelos módulos da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Organizações</h3>
              <p className="text-sm text-gray-600 mt-1">Gerenciar organizações</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Clínicas</h3>
              <p className="text-sm text-gray-600 mt-1">Gerenciar clínicas</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Empresas</h3>
              <p className="text-sm text-gray-600 mt-1">Gerenciar empresas</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Avaliações</h3>
              <p className="text-sm text-gray-600 mt-1">Criar e gerenciar avaliações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
