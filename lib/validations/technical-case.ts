import { z } from 'zod';

export const technicalCaseTypes = [
  'monitoring',
  'help_request',
  'complaint',
  'intervention',
  'other',
] as const;

export const technicalCaseStatuses = [
  'open',
  'in_progress',
  'referred',
  'closed',
  'archived',
] as const;

export const technicalRiskLevels = ['low', 'medium', 'high', 'critical'] as const;

export const technicalEventTypes = [
  'attendance',
  'technical_note',
  'referral',
  'evidence',
  'intervention',
  'status_change',
] as const;

export const createTechnicalCaseSchema = z.object({
  companyId: z.string().uuid('Selecione uma empresa válida.'),
  employeeId: z.string().uuid('Selecione um colaborador válido.').nullable().optional(),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(5000).nullable().optional(),
  caseType: z.enum(technicalCaseTypes).default('monitoring'),
  riskLevel: z.enum(technicalRiskLevels).default('medium'),
  status: z.enum(technicalCaseStatuses).default('open'),
});

export const updateTechnicalCaseSchema = createTechnicalCaseSchema
  .omit({ companyId: true, employeeId: true })
  .partial();

export const createTechnicalCaseEventSchema = z.object({
  eventType: z.enum(technicalEventTypes).default('technical_note'),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(5000).nullable().optional(),
  eventDate: z.string().datetime().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});
