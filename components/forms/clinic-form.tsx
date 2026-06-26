'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { clinicSchema, type ClinicInput } from '../../lib/validations/clinic';
import type { Clinic } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

export function ClinicForm({
  initialData,
  onSubmit,
}: {
  initialData?: Clinic | null;
  onSubmit: (data: ClinicInput) => Promise<void>;
}) {
  const form = useForm<ClinicInput>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      name: initialData?.name || '',
      cnpj: initialData?.cnpj || '',
      responsibleName: initialData?.responsibleName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      specialties: initialData?.specialties?.join(', ') || '',
      status: initialData?.status || 'active',
    },
  });

  const fields: Array<{
    name: keyof ClinicInput;
    label: string;
    placeholder?: string;
    type?: string;
  }> = [
    { name: 'name', label: 'Nome', placeholder: 'Clínica Central' },
    { name: 'cnpj', label: 'CNPJ', placeholder: '12.345.678/0001-90' },
    { name: 'responsibleName', label: 'Responsável', placeholder: 'Nome do responsável' },
    { name: 'email', label: 'E-mail', type: 'email', placeholder: 'contato@clinica.com.br' },
    { name: 'phone', label: 'Telefone', placeholder: '(11) 99999-9999' },
    { name: 'address', label: 'Endereço', placeholder: 'Rua, número, cidade - UF' },
    { name: 'specialties', label: 'Especialidades', placeholder: 'Psicologia, Psiquiatria' },
  ];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
      >
        {fields.map(({ name, label, placeholder, type }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input
                    type={type}
                    placeholder={placeholder}
                    {...field}
                    value={String(field.value ?? '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  {...field}
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                  <option value="archived">Arquivada</option>
                </select>
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar clínica'}
        </Button>
      </form>
    </Form>
  );
}
