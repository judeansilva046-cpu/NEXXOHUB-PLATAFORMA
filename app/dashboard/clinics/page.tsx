'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ClinicForm } from '@/components/forms/clinic-form';
import { Clinic } from '@/types';
import { toast } from 'sonner';

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/clinics');
      if (!res.ok) throw new Error('Failed to fetch clinics');
      const data = await res.json();
      setClinics(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clínicas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Filter clinics based on search term
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.cnpj.includes(searchTerm)
    );
  }, [clinics, searchTerm]);

  const handleCreateClinic = async (data: any) => {
    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create clinic');

      toast.success('Clínica criada com sucesso!');
      setIsDialogOpen(false);
      fetchClinics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar clínica');
      throw err;
    }
  };

  const handleUpdateClinic = async (data: any) => {
    if (!editingClinic) return;

    try {
      const res = await fetch(`/api/clinics/${editingClinic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update clinic');

      toast.success('Clínica atualizada com sucesso!');
      setIsDialogOpen(false);
      setEditingClinic(null);
      fetchClinics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar clínica');
      throw err;
    }
  };

  const handleDeleteClinic = async (clinicId: string) => {
    try {
      const res = await fetch(`/api/clinics/${clinicId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete clinic');

      toast.success('Clínica deletada com sucesso!');
      setDeleteConfirmId(null);
      fetchClinics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar clínica');
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
          <h1 className="text-3xl font-bold text-gray-900">Clínicas</h1>
          <p className="text-gray-600 mt-2">Gerenciar suas clínicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setEditingClinic(null)}
            >
              + Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClinic ? 'Editar Clínica' : 'Nova Clínica'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da clínica
              </DialogDescription>
            </DialogHeader>
            <ClinicForm
              initialData={editingClinic}
              onSubmit={editingClinic ? handleUpdateClinic : handleCreateClinic}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clínicas</CardTitle>
          <CardDescription>Total: {filteredClinics.length} de {clinics.length} clínica(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          {filteredClinics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma clínica encontrada</p>
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
                {filteredClinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell className="font-medium">{clinic.name}</TableCell>
                    <TableCell>{clinic.cnpj}</TableCell>
                    <TableCell>{clinic.phone || '-'}</TableCell>
                    <TableCell>
                      {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={isDialogOpen && editingClinic?.id === clinic.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingClinic(clinic)}
                          >
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Clínica</DialogTitle>
                            <DialogDescription>
                              Atualize os dados da clínica
                            </DialogDescription>
                          </DialogHeader>
                          <ClinicForm
                            initialData={clinic}
                            onSubmit={handleUpdateClinic}
                          />
                        </DialogContent>
                      </Dialog>

                      {deleteConfirmId === clinic.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClinic(clinic.id)}
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
                          onClick={() => setDeleteConfirmId(clinic.id)}
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
