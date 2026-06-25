import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.enum(['admin', 'manager', 'user']),
  organizationId: z.string().uuid('ID de organização inválido'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'user']).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const inviteUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'manager', 'user']),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
