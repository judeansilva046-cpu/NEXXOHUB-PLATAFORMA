import { z } from 'zod';

export const companyOrganizationResources = [
  'branches',
  'departments',
  'positions',
  'employees',
] as const;

export type CompanyOrganizationResource = (typeof companyOrganizationResources)[number];

export const recordStatusSchema = z.enum(['active', 'inactive', 'archived']);

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const emptyToNull = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const optionalText = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalUuid = z.preprocess(emptyToNull, z.string().uuid().nullable().optional());

export const branchRecordSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da filial').max(255),
  cnpj: optionalText(20),
  city: optionalText(120),
  state: optionalText(2),
  address: optionalText(500),
  status: recordStatusSchema.default('active'),
});

export const departmentRecordSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do departamento').max(255),
  branchId: optionalUuid,
  status: recordStatusSchema.default('active'),
});

export const positionRecordSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do cargo').max(255),
  cboCode: optionalText(20),
  departmentId: optionalUuid,
  status: recordStatusSchema.default('active'),
});

export const employeeRecordSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Informe o nome completo').max(255),
    cpf: z.string().trim().min(11, 'Informe o CPF').max(20),
    registration: z.string().trim().min(1, 'Informe a matrícula').max(100),
    email: z.string().trim().email('Informe um e-mail válido'),
    phone: optionalText(30),
    admissionDate: z.preprocess(
      emptyToUndefined,
      z.string().date('Data de admissão inválida').optional()
    ),
    branchId: optionalUuid,
    departmentId: optionalUuid,
    positionId: optionalUuid,
    department: optionalText(255),
    position: optionalText(255),
    status: recordStatusSchema.default('active'),
  })
  .refine((input) => Boolean(input.positionId || input.position), {
    message: 'Selecione um cargo ou informe o cargo manualmente',
    path: ['positionId'],
  });

export const statusUpdateSchema = z.object({
  status: recordStatusSchema,
});

export function isCompanyOrganizationResource(value: string): value is CompanyOrganizationResource {
  return (companyOrganizationResources as readonly string[]).includes(value);
}

export type BranchRecordInput = z.infer<typeof branchRecordSchema>;
export type DepartmentRecordInput = z.infer<typeof departmentRecordSchema>;
export type PositionRecordInput = z.infer<typeof positionRecordSchema>;
export type EmployeeRecordInput = z.infer<typeof employeeRecordSchema>;
export type RecordStatusInput = z.infer<typeof recordStatusSchema>;
