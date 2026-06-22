import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  position: z.string().min(2, 'Cargo é obrigatório'),
  department: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['M', 'F', 'O', 'N']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
