import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  fullName: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  position: z.string().trim().min(2, 'Cargo é obrigatório'),
  department: z.string().trim().optional(),
  birthDate: z.string().date().optional(),
  gender: z.enum(['M', 'F', 'O', 'N']).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
