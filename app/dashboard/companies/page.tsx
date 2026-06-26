'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { CompanyForm } from '../../../components/forms/company-form';
import { Clinic, Company } from '../../../types';
import { toast } from 'sonner';
import type { CompanyInput } from '../../../lib/validations/company';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetch('/api/clinics')
      .then((response) => response.json())
      .then((result) => setClinics(result.data || []))
      .catch(() => setClinics([]));
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj.includes(searchTerm)
    );
  }, [companies, searchTerm]);

  const handleCreateCompany = async (data: CompanyInput) => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.error?.message || 'Erro ao criar empresa');
      }

      toast.success('Empresa criada com sucesso!');
      setIsDialogOpen(false);
      fetchCompanies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar empresa');
      throw err;
    }
  };

  const handleUpdateCompany = async (data: CompanyInput) => {
    if (!editingCompany) return;

    try {
      const res = await fetch(`/api/companies/${editingCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.error?.message || 'Erro ao atualizar empresa');
      }

      toast.success('Empresa atualizada com sucesso!');
      setIsDialogOpen(false);
      setEditingCompany(null);
      fetchCompanies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar empresa');
      throw err;
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete company');

      toast.success('Empresa deletada com sucesso!');
      setDeleteConfirmId(null);
      fetchCompanies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar empresa');
    }
  };

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600 mt-2">Gerenciar suas empresas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setEditingCompany(null)}
            >
              + Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
              <DialogDescription>Preencha os dados da empresa</DialogDescription>
            </DialogHeader>
            <CompanyForm
              initialData={editingCompany}
              clinics={clinics}
              onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>
            Total: {filteredCompanies.length} de {companies.length} empresa(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell>{company.phone || '-'}</TableCell>
                    <TableCell>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog
                        open={isDialogOpen && editingCompany?.id === company.id}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCompany(company)}
                          >
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Empresa</DialogTitle>
                            <DialogDescription>Atualize os dados da empresa</DialogDescription>
                          </DialogHeader>
                          <CompanyForm
                            initialData={company}
                            clinics={clinics}
                            onSubmit={handleUpdateCompany}
                          />
                        </DialogContent>
                      </Dialog>

                      {deleteConfirmId === company.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCompany(company.id)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteConfirmId(company.id)}
                        >
                          Deletar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
