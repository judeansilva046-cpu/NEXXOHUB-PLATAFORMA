import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
