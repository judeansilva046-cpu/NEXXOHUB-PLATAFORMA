import { z } from 'zod';

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.')
  .nullable()
  .optional();

const pgrBaseSchema = z.object({
  companyId: z.string().uuid('Selecione uma empresa válida.'),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(5000).nullable().optional(),
  periodStart: optionalDate,
  periodEnd: optionalDate,
  status: z.enum(['draft', 'published']).default('draft'),
  changeSummary: z.string().trim().max(1000).nullable().optional(),
  content: z.record(z.unknown()).default({}),
});

const validPeriod = <T extends { periodStart?: string | null; periodEnd?: string | null }>(
  value: T
) => !value.periodStart || !value.periodEnd || value.periodEnd >= value.periodStart;

export const createPgrSchema = pgrBaseSchema.refine(validPeriod, {
  message: 'A data final deve ser igual ou posterior à inicial.',
  path: ['periodEnd'],
});

export const updatePgrSchema = pgrBaseSchema
  .omit({ companyId: true })
  .partial()
  .extend({ status: z.enum(['draft', 'published', 'archived']).optional() })
  .refine(validPeriod, {
    message: 'A data final deve ser igual ou posterior à inicial.',
    path: ['periodEnd'],
  });
