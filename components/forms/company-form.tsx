'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { companySchema, type CompanyInput } from '../../lib/validations/company';
import type { Clinic, Company } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

export function CompanyForm({
  initialData,
  clinics,
  onSubmit,
}: {
  initialData?: Company | null;
  clinics: Clinic[];
  onSubmit: (data: CompanyInput) => Promise<void>;
}) {
  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      clinicId: initialData?.clinicId || '',
      legalName: initialData?.legalName || '',
      name: initialData?.name || '',
      cnpj: initialData?.cnpj || '',
      hrResponsible: initialData?.hrResponsible || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      employeeCount: initialData?.employeeCount || 0,
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
          name="clinicId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clínica responsável</FormLabel>
              <FormControl>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  {...field}
                >
                  <option value="">Selecione uma clínica</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {[
          ['legalName', 'Razão Social', 'Empresa Exemplo S.A.'],
          ['name', 'Nome Fantasia', 'Empresa Exemplo'],
          ['cnpj', 'CNPJ', '12.345.678/0001-90'],
          ['hrResponsible', 'Responsável de RH', 'Nome do responsável'],
          ['email', 'E-mail', 'rh@empresa.com.br'],
          ['phone', 'Telefone', '(11) 99999-9999'],
          ['address', 'Endereço', 'Rua, número, cidade - UF'],
        ].map(([name, label, placeholder]) => (
          <FormField
            key={name}
            control={form.control}
            name={name as keyof CompanyInput}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input placeholder={placeholder} {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="employeeCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de colaboradores</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
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
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar empresa'}
        </Button>
      </form>
    </Form>
  );
}
