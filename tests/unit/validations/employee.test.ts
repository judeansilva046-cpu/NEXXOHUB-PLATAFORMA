import { describe, expect, it } from 'vitest';
import { createEmployeeSchema } from '../../../lib/validations/employee';

const validEmployee = {
  companyId: '11111111-1111-4111-8111-111111111111',
  fullName: 'João Silva Santos',
  cpf: '123.456.789-00',
  registration: 'MAT-001',
  position: 'Analista',
  department: 'Recursos Humanos',
  email: 'joao@empresa.com',
  phone: '(11) 99999-9999',
  admissionDate: '2024-05-15',
  status: 'active' as const,
};

describe('Employee Validation Schema', () => {
  it('validates complete employee data', () => {
    expect(createEmployeeSchema.safeParse(validEmployee).success).toBe(true);
  });

  it('requires a valid company', () => {
    expect(createEmployeeSchema.safeParse({ ...validEmployee, companyId: '' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(createEmployeeSchema.safeParse({ ...validEmployee, email: 'invalid' }).success).toBe(
      false
    );
  });

  it('rejects invalid CPF', () => {
    expect(createEmployeeSchema.safeParse({ ...validEmployee, cpf: '123' }).success).toBe(false);
  });

  it('rejects invalid admission date', () => {
    expect(
      createEmployeeSchema.safeParse({ ...validEmployee, admissionDate: 'invalid' }).success
    ).toBe(false);
  });

  it('requires registration', () => {
    expect(createEmployeeSchema.safeParse({ ...validEmployee, registration: '' }).success).toBe(
      false
    );
  });

  it('requires department', () => {
    expect(createEmployeeSchema.safeParse({ ...validEmployee, department: '' }).success).toBe(
      false
    );
  });

  it('accepts supported statuses', () => {
    for (const status of ['active', 'inactive', 'archived'] as const) {
      expect(createEmployeeSchema.safeParse({ ...validEmployee, status }).success).toBe(true);
    }
  });

  it('trims whitespace from text fields', () => {
    const result = createEmployeeSchema.parse({
      ...validEmployee,
      fullName: '  João Silva Santos  ',
      position: '  Analista  ',
    });
    expect(result.fullName).toBe('João Silva Santos');
    expect(result.position).toBe('Analista');
  });
});
