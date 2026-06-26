import { z } from 'zod';

export const documentSchema = z.object({
  companyId: z.string().uuid().optional().or(z.literal('')),
  documentType: z.enum(['nr1_evidence', 'contract', 'report', 'other']),
  title: z.string().min(3, 'Informe o título'),
});

export type DocumentInput = z.infer<typeof documentSchema>;
