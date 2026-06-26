import { z } from 'zod';

export const companySchema = z.object({
  clinicId: z.string().uuid('Selecione uma clínica'),
  legalName: z.string().trim().min(2, 'Informe a razão social').max(255),
  name: z.string().trim().min(2, 'Informe o nome fantasia').max(255),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  hrResponsible: z.string().trim().min(2, 'Informe o responsável de RH').max(255),
  email: z.string().trim().email('Email inválido'),
  phone: z.string().trim().min(8, 'Telefone inválido').max(30),
  address: z.string().trim().min(5, 'Informe o endereço').max(500),
  employeeCount: z.coerce.number().int().min(0).default(0),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type CompanyInput = z.infer<typeof companySchema>;
export const createCompanySchema = companySchema;
export const updateCompanySchema = companySchema.partial();
