import { z } from 'zod';

export const clinicSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da clínica').max(255),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  responsibleName: z.string().trim().min(2, 'Informe o responsável').max(255),
  email: z.string().trim().email('Email inválido'),
  phone: z.string().trim().min(8, 'Telefone inválido').max(30),
  address: z.string().trim().min(5, 'Informe o endereço').max(500),
  specialties: z.string().trim().max(500).optional().default(''),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type ClinicInput = z.infer<typeof clinicSchema>;
export const createClinicSchema = clinicSchema;
export const updateClinicSchema = clinicSchema.partial();
