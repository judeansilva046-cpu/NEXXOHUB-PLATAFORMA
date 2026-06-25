'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

interface UserProfile {
  id?: string;
  email?: string;
  full_name?: string;
  fullName?: string;
  role?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('[PROFILE] Fetching user profile...');
        const res = await fetch('/api/auth/me');

        if (!res.ok) {
          console.error('[PROFILE] Failed to fetch:', res.status);
          setError('Falha ao carregar perfil');
          return;
        }

        const data = await res.json();
        console.log('[PROFILE] User data:', data);

        if (data.success && data.data) {
          setUser(data.data);
        } else {
          setError('Dados do perfil inválidos');
        }
      } catch (err) {
        console.error('[PROFILE] Error:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Carregando perfil...</div>
      </div>
    );
  }

  const userName = user?.full_name || user?.fullName || 'Usuário';
  const userEmail = user?.email || 'Não informado';
  const userRole = user?.role || 'Sem função';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">Gerenciar informações do perfil</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Dados do seu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <p className="text-gray-900 mt-1">{userName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{userEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Função</label>
                <p className="text-gray-900 mt-1">{userRole}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Gerencie sua senha e segurança</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                Alterar Senha
              </Button>
              <Button variant="outline" className="w-full">
                Ativar 2FA
              </Button>
              <Button variant="outline" className="w-full">
                Sessões Ativas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>Customize sua experiência</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Tema Escuro</label>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Notificações</label>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
