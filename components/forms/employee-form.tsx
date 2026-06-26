'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { employeeSchema, type EmployeeInput } from '../../lib/validations/employee';
import type { Company, Employee } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

export function EmployeeForm({
  initialData,
  companies,
  onSubmit,
}: {
  initialData?: Employee | null;
  companies: Company[];
  onSubmit: (data: EmployeeInput) => Promise<void>;
}) {
  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      companyId: initialData?.companyId || '',
      fullName: initialData?.fullName || '',
      cpf: initialData?.cpf || '',
      registration: initialData?.registration || '',
      position: initialData?.position || '',
      department: initialData?.department || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      admissionDate: initialData?.admissionDate || '',
      status: initialData?.status || 'active',
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
      >
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa</FormLabel>
              <FormControl>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  {...field}
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {[
          ['fullName', 'Nome completo', 'João Silva', 'text'],
          ['cpf', 'CPF', '123.456.789-00', 'text'],
          ['registration', 'Matrícula', 'MAT-001', 'text'],
          ['position', 'Cargo', 'Analista', 'text'],
          ['department', 'Departamento', 'Recursos Humanos', 'text'],
          ['email', 'E-mail', 'colaborador@empresa.com.br', 'email'],
          ['phone', 'Telefone', '(11) 99999-9999', 'text'],
          ['admissionDate', 'Data de admissão', '', 'date'],
        ].map(([name, label, placeholder, type]) => (
          <FormField
            key={name}
            control={form.control}
            name={name as keyof EmployeeInput}
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
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || companies.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar colaborador'}
        </Button>
      </form>
    </Form>
  );
}
