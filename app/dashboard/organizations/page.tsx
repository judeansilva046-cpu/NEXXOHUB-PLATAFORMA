'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

interface Organization {
  id?: string;
  name?: string;
  cnpj?: string;
}

export default function OrganizationsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        console.log('[ORGANIZATIONS] Fetching organization...');
        const res = await fetch('/api/organizations');

        if (!res.ok) {
          console.warn('[ORGANIZATIONS] Failed to fetch:', res.status);
          setOrganization(null);
          return;
        }

        const data = await res.json();
        console.log('[ORGANIZATIONS] Data:', data);

        if (data.success && data.data) {
          setOrganization(data.data);
        }
      } catch (err) {
        console.error('[ORGANIZATIONS] Error:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar organização');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Carregando organização...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizações</h1>
        <p className="text-gray-600 mt-2">Gerencie sua organização</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {organization ? (
        <Card>
          <CardHeader>
            <CardTitle>Sua Organização</CardTitle>
            <CardDescription>Informações da organização</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <p className="text-gray-900 mt-1">{organization.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CNPJ</label>
                <p className="text-gray-900 mt-1">{organization.cnpj || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Organização</CardTitle>
            <CardDescription>Você ainda não tem uma organização criada</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Criar Organização</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
