'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { updateOrganizationSchema, type UpdateOrganizationInput } from '../../../lib/validations/organization';
import { useOrganization, useCurrentUser } from '../../../lib/hooks/use-api';
import { api } from '../../../lib/api/fetch';

export default function OrganizationsPage() {
  const { data: organization, isLoading, error, refetch } = useOrganization();
  const { data: user } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = user?.role === 'admin';

  const form = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationSchema),
    values: organization
      ? {
          name: organization.name,
          cnpj: organization.cnpj,
          phone: organization.phone,
          website: organization.website,
          description: organization.description,
        }
      : undefined,
  });

  const handleUpdate = async (data: UpdateOrganizationInput) => {
    try {
      await api.put('/api/organizations', data);
      toast.success('Organização atualizada com sucesso!');
      setIsEditing(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
      throw err;
    }
  };

  if (isLoading) {
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
          <p className="text-red-600 font-medium">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organização</h1>
          <p className="text-gray-600 mt-2">Dados da sua organização</p>
        </div>
        {isAdmin && !isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
            Editar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{organization?.name}</CardTitle>
          <CardDescription>CNPJ: {organization?.cnpj}</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4 max-w-lg">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Salvar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Telefone</dt>
                <dd className="font-medium">{organization?.phone || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Website</dt>
                <dd className="font-medium">{organization?.website || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Descrição</dt>
                <dd className="font-medium">{organization?.description || '-'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
