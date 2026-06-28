import { z } from 'zod';

export const learningStatuses = ['draft', 'active', 'archived'] as const;

const title = z.string().trim().min(2, 'Informe um título com pelo menos 2 caracteres.').max(160);
const description = z.string().trim().max(3000).nullable().optional();
const status = z.enum(learningStatuses).default('draft');
const optionalCompanyId = z.string().uuid().nullable().optional();

export const createProgramSchema = z.object({
  title,
  description,
  status,
  companyId: optionalCompanyId,
});

export const createTrackSchema = z.object({
  title,
  description,
  status,
  programId: z.string().uuid('Selecione um programa válido.'),
  position: z.coerce.number().int().min(0).max(10000).default(0),
});

export const createModuleSchema = z.object({
  title,
  description,
  status,
  trackId: z.string().uuid('Selecione uma trilha válida.'),
  position: z.coerce.number().int().min(0).max(10000).default(0),
});

export const createLessonSchema = z.object({
  title,
  description,
  status,
  moduleId: z.string().uuid('Selecione um módulo válido.'),
  position: z.coerce.number().int().min(0).max(10000).default(0),
  durationMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  videoProvider: z.enum(['vimeo']).nullable().optional(),
  videoExternalId: z.string().trim().max(255).nullable().optional(),
});

const updateBaseSchema = z.object({
  title: title.optional(),
  description,
  status: z.enum(learningStatuses).optional(),
});

export const updateProgramSchema = updateBaseSchema.extend({
  companyId: optionalCompanyId,
});

export const updateTrackSchema = updateBaseSchema.extend({
  position: z.coerce.number().int().min(0).max(10000).optional(),
});

export const updateModuleSchema = updateTrackSchema;

export const updateLessonSchema = updateTrackSchema.extend({
  durationMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  videoProvider: z.enum(['vimeo']).nullable().optional(),
  videoExternalId: z.string().trim().max(255).nullable().optional(),
});

export type LearningResource = 'programs' | 'tracks' | 'modules' | 'lessons';

export function isLearningResource(value: string): value is LearningResource {
  return ['programs', 'tracks', 'modules', 'lessons'].includes(value);
}
