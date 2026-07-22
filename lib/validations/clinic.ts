import { z } from 'zod';

export const createClinicSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
});

export type CreateClinicInput = z.infer<typeof createClinicSchema>;

export const updateClinicSchema = createClinicSchema.partial();

export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
