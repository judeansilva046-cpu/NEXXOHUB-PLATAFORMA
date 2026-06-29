'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ListChecks } from 'lucide-react';
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
import { StepTimeline } from '../../../components/clinic/guided-workspace';
import { StatusPill } from '../../../components/workspace/panel';
import type { CompanyImplementation } from '../../../lib/clinic-guidance';
import type { CompanyInput } from '../../../lib/validations/company';
import type { Clinic, Company } from '../../../types';

type ClinicSummary = Pick<Clinic, 'id' | 'name'>;

type DialogState = { mode: 'create'; company?: never } | { mode: 'edit'; company: Company } | null;

export function ClinicCompaniesClient({
  initialCompanies,
  clinic,
  canManage,
  implementations,
}: {
  initialCompanies: Company[];
  clinic: ClinicSummary;
  canManage: boolean;
  implementations: CompanyImplementation[];
}) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies]);

  const implementationByCompany = useMemo(
    () =>
      new Map(implementations.map((implementation) => [implementation.companyId, implementation])),
    [implementations]
  );

  const implementationSummary = useMemo(() => {
    const total = implementations.length;
    const average = total
      ? Math.round(implementations.reduce((sum, item) => sum + item.progress, 0) / total)
      : 0;
    return {
      total,
      average,
      pending: implementations.filter((item) => item.progress < 100).length,
      overdue: implementations.filter((item) => item.statusTone === 'red').length,
    };
  }, [implementations]);

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
      router.refresh();
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
            Gerencie as empresas vinculadas à clínica {clinic.name} e acompanhe a implantação.
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Implantação média</p>
              <p className="text-2xl font-bold text-gray-900">{implementationSummary.average}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ListChecks className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Empresas no checklist</p>
              <p className="text-2xl font-bold text-gray-900">{implementationSummary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{implementationSummary.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Atrasadas</p>
              <p className="text-2xl font-bold text-gray-900">{implementationSummary.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>
            Total: {filteredCompanies.length} de {companies.length} empresa(s). Fluxo: Empresa →
            Estrutura → Diagnóstico → PGR → Plano → Conteúdo → Dossiê.
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
                  <TableHead>Implantação</TableHead>
                  <TableHead>Criada em</TableHead>
                  {canManage && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => {
                  const implementation = implementationByCompany.get(company.id);
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.cnpj}</TableCell>
                      <TableCell>{company.phone || '-'}</TableCell>
                      <TableCell>{company.employeeCount}</TableCell>
                      <TableCell className="min-w-64">
                        {implementation ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <StatusPill
                                label={implementation.statusLabel}
                                tone={implementation.statusTone}
                              />
                              <span className="text-xs font-semibold text-gray-900">
                                {implementation.progress}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                style={{ width: `${implementation.progress}%` }}
                              />
                            </div>
                            {implementation.nextStep && (
                              <Link
                                href={implementation.nextStep.href}
                                className="block text-xs font-medium text-blue-700 hover:underline"
                              >
                                Próximo: {implementation.nextStep.label}
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Sincronizando checklist...</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de implantação pela Clínica</CardTitle>
          <CardDescription>
            Acompanhe as 12 etapas obrigatórias de cada empresa. As telas técnicas continuam
            acessíveis pelo próximo passo de cada item.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {implementations.slice(0, 4).map((implementation) => (
            <div key={implementation.companyId} className="rounded-2xl border border-gray-100 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {implementation.companyName}
                    </h3>
                    <StatusPill
                      label={implementation.statusLabel}
                      tone={implementation.statusTone}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {implementation.completed} de {implementation.total} etapas concluídas
                  </p>
                </div>
                <span className="rounded-xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900">
                  {implementation.progress}%
                </span>
              </div>
              <StepTimeline implementation={implementation} />
            </div>
          ))}
          {!implementations.length && (
            <div className="rounded-xl border border-dashed py-10 text-center text-gray-500 xl:col-span-2">
              Cadastre uma empresa para iniciar o checklist de implantação.
            </div>
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
