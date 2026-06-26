import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(12, 'Senha deve ter no mínimo 12 caracteres')
      .regex(/[a-z]/, 'Inclua uma letra minúscula')
      .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
      .regex(/\d/, 'Inclua um número')
      .regex(/[^A-Za-z0-9]/, 'Inclua um símbolo'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    organizationName: z.string().min(2, 'Nome da organização é obrigatório'),
    organizationCnpj: z.string().regex(/^\d{14}$/, 'Informe o CNPJ com 14 números'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Senha deve ter no mínimo 12 caracteres')
      .regex(/[a-z]/, 'Inclua uma letra minúscula')
      .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
      .regex(/\d/, 'Inclua um número')
      .regex(/[^A-Za-z0-9]/, 'Inclua um símbolo'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
