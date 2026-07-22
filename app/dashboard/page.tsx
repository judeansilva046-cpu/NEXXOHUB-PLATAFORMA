'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useCurrentUser, useOrganization } from '../../lib/hooks/use-api';

const modules = [
  { href: '/dashboard/organizations', title: 'Organização', description: 'Gerenciar dados da organização' },
  { href: '/dashboard/clinics', title: 'Clínicas', description: 'Gerenciar clínicas' },
  { href: '/dashboard/companies', title: 'Empresas', description: 'Gerenciar empresas clientes' },
  { href: '/dashboard/employees', title: 'Colaboradores', description: 'Gerenciar colaboradores' },
  { href: '/dashboard/assessments', title: 'Avaliações', description: 'Criar e gerenciar avaliações psicossociais' },
  { href: '/dashboard/reports', title: 'Relatórios', description: 'Visualizar e gerar relatórios' },
];

export default function DashboardPage() {
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: organization, isLoading: orgLoading } = useOrganization();

  if (userLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  if (userError && !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
          <p className="text-red-500 text-sm">{userError.message}</p>
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
            <div className="text-2xl font-bold text-gray-900">{organization?.name || '-'}</div>
            <p className="text-xs text-gray-500 mt-2">CNPJ: {organization?.cnpj || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usuário</CardTitle>
            <CardDescription>Seu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {user?.fullName || 'Usuário'}
            </div>
            <p className="text-xs text-gray-500 mt-2">Função: {user?.role || 'Sem função'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <CardDescription>Seu contato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 truncate">{user?.email || '-'}</div>
            <p className="text-xs text-gray-500 mt-2">
              Acesso: {new Date().toLocaleDateString('pt-BR')}
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
            {modules.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{mod.description}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
