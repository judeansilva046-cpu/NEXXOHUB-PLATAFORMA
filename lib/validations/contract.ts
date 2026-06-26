import { z } from 'zod';

export const contractSchema = z.object({
  clinicId: z.string().uuid('Selecione uma clínica'),
  companyId: z.string().uuid('Selecione uma empresa'),
  contractNumber: z.string().min(2, 'Informe o número do contrato'),
  startsOn: z.string().min(10, 'Informe a data inicial'),
  endsOn: z.string().optional().or(z.literal('')),
  monthlyValue: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  coveredEmployees: z.coerce
    .number()
    .int('Informe uma quantidade inteira')
    .min(0, 'A quantidade não pode ser negativa'),
  status: z.enum(['draft', 'active', 'suspended', 'expired', 'cancelled']),
});

export type ContractInput = z.infer<typeof contractSchema>;
