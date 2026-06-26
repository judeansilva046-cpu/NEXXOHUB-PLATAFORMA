import { z } from 'zod';

export const riskFactorSchema = z.object({
  companyId: z.string().uuid().optional().or(z.literal('')),
  code: z.string().min(2, 'Informe o código'),
  name: z.string().min(3, 'Informe o fator de risco'),
  category: z.string().min(2, 'Informe a categoria'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

export type RiskFactorInput = z.infer<typeof riskFactorSchema>;
