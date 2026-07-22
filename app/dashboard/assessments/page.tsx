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
import { AssessmentForm } from '../../../components/forms/assessment-form';
import { Assessment } from '../../../types';
import { useAssessments, useAssessmentMutations } from '../../../lib/hooks/use-api';
import { CreateAssessmentInput } from '../../../lib/validations/assessment';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  closed: 'Encerrada',
};

export default function AssessmentsPage() {
  const { data: assessments = [], isLoading, error } = useAssessments();
  const { create, update, remove } = useAssessmentMutations();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      assessments.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [assessments, searchTerm]
  );

  const handleCreate = async (data: CreateAssessmentInput) => {
    try {
      await create.mutateAsync(data);
      toast.success('Avaliação criada com sucesso!');
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar avaliação');
      throw err;
    }
  };

  const handleUpdate = async (data: CreateAssessmentInput) => {
    if (!editingAssessment) return;
    try {
      await update.mutateAsync({ id: editingAssessment.id, data });
      toast.success('Avaliação atualizada com sucesso!');
      setIsDialogOpen(false);
      setEditingAssessment(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Avaliação deletada com sucesso!');
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar');
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
          <h1 className="text-3xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-gray-600 mt-2">Gerenciar avaliações psicossociais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setEditingAssessment(null)}
            >
              + Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAssessment ? 'Editar Avaliação' : 'Nova Avaliação'}
              </DialogTitle>
              <DialogDescription>Preencha os dados da avaliação</DialogDescription>
            </DialogHeader>
            <AssessmentForm
              initialData={editingAssessment}
              onSubmit={editingAssessment ? handleUpdate : handleCreate}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Avaliações</CardTitle>
          <CardDescription>
            Total: {filtered.length} de {assessments.length} avaliação(ões)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma avaliação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.title}</TableCell>
                    <TableCell>{statusLabels[assessment.status] || assessment.status}</TableCell>
                    <TableCell>
                      {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAssessment(assessment);
                          setIsDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      {deleteConfirmId === assessment.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(assessment.id)}
                          >
                            Confirmar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => setDeleteConfirmId(assessment.id)}
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
