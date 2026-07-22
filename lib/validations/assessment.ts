import { z } from 'zod';

export const assessmentQuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Pergunta é obrigatória'),
  type: z.enum(['text', 'scale', 'multiple_choice']).default('scale'),
  options: z.array(z.string()).optional(),
});

export const createAssessmentSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(255),
  description: z.string().max(2000).optional(),
  employeeId: z.string().uuid().optional(),
  questions: z.array(assessmentQuestionSchema).default([]),
  status: z.enum(['draft', 'active', 'closed']).default('draft'),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const updateAssessmentSchema = createAssessmentSchema.partial();

export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;

export const createReportSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(255),
  description: z.string().max(2000).optional(),
  assessmentId: z.string().uuid().optional(),
  reportData: z.record(z.unknown()).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = createReportSchema.partial();

export type UpdateReportInput = z.infer<typeof updateReportSchema>;
