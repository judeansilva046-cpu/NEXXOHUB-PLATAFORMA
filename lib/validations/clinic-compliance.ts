import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida no formato AAAA-MM-DD.');

export const evidenceTypes = [
  'document',
  'meeting_minutes',
  'training_record',
  'attendance_record',
  'technical_note',
  'photo',
  'other',
] as const;

export const evidenceRelations = [
  'nr1',
  'pgr',
  'technical_case',
  'action_plan',
  'training',
  'other',
] as const;

export const dossierStatuses = ['draft', 'generated', 'archived'] as const;

export const createEvidenceSchema = z.object({
  companyId: z.string().uuid('Selecione uma empresa válida.'),
  title: z.string().trim().min(3, 'Informe o título da evidência.').max(180),
  description: z.string().trim().max(5000).nullable().optional(),
  evidenceDate: dateSchema.nullable().optional(),
  storagePath: z.string().trim().max(1000).nullable().optional(),
  evidenceType: z.enum(evidenceTypes).default('document'),
  relatedTo: z.enum(evidenceRelations).default('nr1'),
});

export const updateEvidenceSchema = createEvidenceSchema.partial();

const dossierBaseSchema = z.object({
  companyId: z.string().uuid('Selecione uma empresa válida.'),
  title: z.string().trim().min(3, 'Informe o título do dossiê.').max(180),
  periodStart: dateSchema,
  periodEnd: dateSchema,
  status: z.enum(dossierStatuses).default('generated'),
  storagePath: z.string().trim().max(1000).nullable().optional(),
});

export const createDossierSchema = dossierBaseSchema.refine(
  (input) => input.periodEnd >= input.periodStart,
  {
    message: 'A data final deve ser igual ou posterior à data inicial.',
    path: ['periodEnd'],
  }
);

export const updateDossierSchema = dossierBaseSchema
  .omit({ companyId: true })
  .partial()
  .refine(
    (input) => !input.periodStart || !input.periodEnd || input.periodEnd >= input.periodStart,
    {
      message: 'A data final deve ser igual ou posterior à data inicial.',
      path: ['periodEnd'],
    }
  );
