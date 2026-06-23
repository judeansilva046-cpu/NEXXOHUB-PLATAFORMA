import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  address: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres').max(500),
  organization_id: z.string().uuid().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
