'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { EmployeeForm } from '../../../components/forms/employee-form';
import { Employee } from '../../../types';
import { useEmployees, useCompanies } from '../../../lib/hooks/use-api';
import { api } from '../../../lib/api/fetch';
import { CreateEmployeeInput } from '../../../lib/validations/employee';

export default function EmployeesPage() {
  const { data: employees = [], isLoading, error, refetch } = useEmployees();
  const { data: companies = [] } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleCreateEmployee = async (data: CreateEmployeeInput) => {
    if (!selectedCompanyId) {
      toast.error('Por favor, selecione uma empresa');
      throw new Error('Company ID required');
    }

    try {
      await api.post('/api/employees', { companyId: selectedCompanyId, ...data });
      toast.success('Colaborador criado com sucesso!');
      setIsDialogOpen(false);
      setSelectedCompanyId('');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar colaborador');
      throw err;
    }
  };

  const handleUpdateEmployee = async (data: CreateEmployeeInput) => {
    if (!editingEmployee) return;

    try {
      await api.put(`/api/employees/${editingEmployee.id}`, data);
      toast.success('Colaborador atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingEmployee(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar colaborador');
      throw err;
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await api.delete(`/api/employees/${employeeId}`);
      toast.success('Colaborador deletado com sucesso!');
      setDeleteConfirmId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar colaborador');
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
          <h1 className="text-3xl font-bold text-gray-900">Colaboradores</h1>
          <p className="text-gray-600 mt-2">Gerenciar seus colaboradores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setEditingEmployee(null);
                setSelectedCompanyId('');
              }}
            >
              + Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
              </DialogTitle>
              <DialogDescription>Preencha os dados do colaborador</DialogDescription>
            </DialogHeader>
            {!editingEmployee && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <EmployeeForm
              initialData={editingEmployee}
              onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
          <CardDescription>
            Total: {filteredEmployees.length} de {employees.length} colaborador(es)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum colaborador encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.fullName}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>
                      {new Date(employee.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingEmployee(employee);
                          setIsDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      {deleteConfirmId === employee.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteEmployee(employee.id)}
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
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteConfirmId(employee.id)}
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
