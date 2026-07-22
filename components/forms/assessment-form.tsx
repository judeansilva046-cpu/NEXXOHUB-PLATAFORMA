'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAssessmentSchema, type CreateAssessmentInput } from '../../lib/validations/assessment';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useState } from 'react';
import { Assessment } from '../../types';

interface AssessmentFormProps {
  initialData?: Assessment | null;
  onSubmit: (data: CreateAssessmentInput) => Promise<void>;
  isLoading?: boolean;
}

export function AssessmentForm({ initialData, onSubmit, isLoading }: AssessmentFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateAssessmentInput>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      status: 'draft',
      questions: [],
    },
  });

  const handleSubmit = async (data: CreateAssessmentInput) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Avaliação Psicossocial Q1" {...field} />
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
                  placeholder="Descrição da avaliação"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  {...field}
                >
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativa</option>
                  <option value="closed">Encerrada</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || form.formState.isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading || form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
