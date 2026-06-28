'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CompanyForm } from '../../../components/forms/company-form';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import type { CompanyInput } from '../../../lib/validations/company';
import type { Clinic, Company } from '../../../types';

type ClinicSummary = Pick<Clinic, 'id' | 'name'>;

type DialogState = { mode: 'create'; company?: never } | { mode: 'edit'; company: Company } | null;

export function ClinicCompaniesClient({
  initialCompanies,
  clinic,
  canManage,
}: {
  initialCompanies: Company[];
  clinic: ClinicSummary;
  canManage: boolean;
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return companies;

    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(normalizedSearch) ||
        company.legalName.toLowerCase().includes(normalizedSearch) ||
        company.cnpj.includes(normalizedSearch)
    );
  }, [companies, searchTerm]);

  const refreshCompanies = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/companies', { cache: 'no-store' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message || 'Erro ao carregar empresas');
      }

      setCompanies(result.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar empresas');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateCompany = async (data: CompanyInput) => {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clinicId: clinic.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message || 'Erro ao criar empresa');
      }

      toast.success('Empresa criada com sucesso!');
      setDialogState(null);
      await refreshCompanies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar empresa');
      throw error;
    }
  };

  const handleUpdateCompany = async (data: CompanyInput) => {
    if (dialogState?.mode !== 'edit') return;

    try {
      const response = await fetch(`/api/companies/${dialogState.company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clinicId: clinic.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message || 'Erro ao atualizar empresa');
      }

      toast.success('Empresa atualizada com sucesso!');
      setDialogState(null);
      await refreshCompanies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar empresa');
      throw error;
    }
  };

  const handleArchiveCompany = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message || 'Erro ao arquivar empresa');
      }

      toast.success('Empresa arquivada com sucesso!');
      setArchiveConfirmId(null);
      await refreshCompanies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao arquivar empresa');
    }
  };

  const editingCompany = dialogState?.mode === 'edit' ? dialogState.company : null;
  const dialogTitle = editingCompany ? 'Editar Empresa' : 'Nova Empresa';
  const dialogDescription = editingCompany
    ? 'Atualize os dados da empresa cliente.'
    : 'Cadastre uma nova empresa vinculada a esta clínica.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empresas clientes</h1>
          <p className="mt-2 text-gray-600">
            Gerencie as empresas vinculadas à clínica {clinic.name}.
          </p>
        </div>
        {canManage && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setDialogState({ mode: 'create' })}
          >
            + Nova Empresa
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>
            Total: {filteredCompanies.length} de {companies.length} empresa(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Buscar por nome, razão social ou CNPJ..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={refreshCompanies} disabled={refreshing}>
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center text-gray-500">
              Nenhuma empresa encontrada para esta clínica.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Colaboradores</TableHead>
                  <TableHead>Criada em</TableHead>
                  {canManage && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell>{company.phone || '-'}</TableCell>
                    <TableCell>{company.employeeCount}</TableCell>
                    <TableCell>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDialogState({ mode: 'edit', company })}
                          >
                            Editar
                          </Button>
                          {archiveConfirmId === company.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleArchiveCompany(company.id)}
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setArchiveConfirmId(null)}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setArchiveConfirmId(company.id)}
                            >
                              Arquivar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <CompanyForm
            key={editingCompany?.id || 'new-company'}
            initialData={editingCompany}
            clinics={[clinic]}
            defaultClinicId={clinic.id}
            hideClinicSelect
            onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
