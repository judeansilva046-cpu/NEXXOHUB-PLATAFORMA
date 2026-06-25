'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Organization } from '../../types';

interface UserData {
  id?: string;
  email?: string;
  full_name?: string;
  fullName?: string;
  role?: string;
  organization_id?: string;
  created_at?: string;
}

// Mock data for charts
const collaboratorData = [
  { name: 'Seg', value: 45 },
  { name: 'Ter', value: 52 },
  { name: 'Qua', value: 48 },
  { name: 'Qui', value: 61 },
  { name: 'Sex', value: 55 },
  { name: 'Sab', value: 42 },
];

const wellbeingData = [
  { name: 'Excelente', value: 28, color: '#10b981' },
  { name: 'Bom', value: 45, color: '#3b82f6' },
  { name: 'Regular', value: 20, color: '#f59e0b' },
  { name: 'Crítico', value: 7, color: '#ef4444' },
];

const programsData = [
  { name: 'Saúde Mental', participantes: 128 },
  { name: 'Liderança', participantes: 87 },
  { name: 'Compliance', participantes: 95 },
  { name: 'Saúde', participantes: 112 },
];

export default function DashboardPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DASHBOARD] Fetching user data from /api/auth/me...');

        // Fetch current user
        const userRes = await fetch('/api/auth/me');

        if (!userRes.ok) {
          console.error('[DASHBOARD] API returned status:', userRes.status);
          const errorData = await userRes.json().catch(() => ({}));
          console.error('[DASHBOARD] Error response:', errorData);
          throw new Error(`Falha ao carregar usuário (status ${userRes.status})`);
        }

        const userData = await userRes.json();
        console.log('[DASHBOARD] API Response:', userData);

        if (!userData.success || !userData.data) {
          throw new Error('Resposta inválida da API');
        }

        console.log('[DASHBOARD] User data loaded successfully:', userData.data);
        setUser(userData.data);

        // Fetch organization (non-critical)
        try {
          const orgRes = await fetch('/api/organizations');
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            if (orgData.success && orgData.data) {
              console.log('[DASHBOARD] Organization data loaded:', orgData.data);
              setOrganization(orgData.data);
            }
          }
        } catch (orgErr) {
          console.warn('[DASHBOARD] Organization fetch failed (non-critical):', orgErr);
          // Organization is optional, don't throw
        }
      } catch (err) {
        console.error('[DASHBOARD] Error:', err);
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
        <div className="text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
          <p className="text-red-500 text-sm">{error}</p>
          <p className="text-red-400 text-xs mt-4">
            Verifique o console (F12) para mais detalhes
          </p>
        </div>
      </div>
    );
  }

  // Get displayable user data (handle both snake_case and camelCase)
  const userName = user?.full_name || user?.fullName || 'Usuário';
  const userEmail = user?.email || 'Não informado';
  const userRole = user?.role || 'Sem função';

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
              {userName}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Função: {userRole}
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
              {userEmail}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Acesso: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">284</div>
            <p className="text-xs text-green-600 mt-2">↑ 12 esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bem-estar Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">74%</div>
            <p className="text-xs text-green-600 mt-2">↑ 13% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-500 mt-2">Sob monitoramento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Programas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-orange-600 mt-2">→ Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores por Semana</CardTitle>
            <CardDescription>Tendência de participação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={collaboratorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Bem-estar</CardTitle>
            <CardDescription>Distribuição geral</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={wellbeingData} cx="50%" cy="50%" labelLine={false} label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {wellbeingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programas por Participação</CardTitle>
          <CardDescription>Colaboradores envolvidos por programa</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={programsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="participantes" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Principais</CardTitle>
          <CardDescription>Navegue pelos módulos da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 hover:bg-blue-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Indicadores</h3>
              <p className="text-sm text-gray-600 mt-1">Monitorar riscos</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-green-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Programas</h3>
              <p className="text-sm text-gray-600 mt-1">Gerenciar programas</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-purple-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Trilhas</h3>
              <p className="text-sm text-gray-600 mt-1">Biblioteca de trilhas</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-orange-50 transition cursor-pointer">
              <h3 className="font-semibold text-gray-900">Suporte</h3>
              <p className="text-sm text-gray-600 mt-1">Preciso de ajuda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
