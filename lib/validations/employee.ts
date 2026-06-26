import { z } from 'zod';

export const employeeSchema = z.object({
  companyId: z.string().uuid('Selecione uma empresa'),
  fullName: z.string().trim().min(2, 'Informe o nome completo').max(255),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  registration: z.string().trim().min(1, 'Informe a matrícula').max(100),
  position: z.string().trim().min(2, 'Informe o cargo').max(255),
  department: z.string().trim().min(2, 'Informe o departamento').max(255),
  email: z.string().trim().email('Email inválido'),
  phone: z.string().trim().min(8, 'Telefone inválido').max(30),
  admissionDate: z.string().date('Data de admissão inválida'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export const createEmployeeSchema = employeeSchema;
export const updateEmployeeSchema = employeeSchema.partial();
