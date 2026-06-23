import { describe, it, expect } from 'vitest';
import { createEmployeeSchema } from '../../../lib/validations/employee';

describe('Employee Validation Schema', () => {
  const validData = {
    fullName: 'João Silva Santos',
    email: 'joao@empresa.com',
    position: 'Desenvolvedor Senior',
    department: 'TI',
    phone: '(11) 99999-9999',
    gender: 'M' as const,
    birthDate: '1990-05-15',
    address: 'Rua das Flores, 123, Apt 456',
  };

  it('validates correct employee data', () => {
    const result = createEmployeeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      fullName: 'João Silva Santos',
      email: 'joao@empresa.com',
      // missing position, department, phone
    };

    const result = createEmployeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const invalidData = {
      ...validData,
      email: 'not-an-email',
    };

    const result = createEmployeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects name shorter than 3 characters', () => {
    const invalidData = {
      ...validData,
      fullName: 'JJ',
    };

    const result = createEmployeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid birth date format', () => {
    const invalidData = {
      ...validData,
      birthDate: 'invalid-date',
    };

    const result = createEmployeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts valid gender values', () => {
    const genders = ['M', 'F', 'O', 'N'];

    genders.forEach(gender => {
      const data = {
        ...validData,
        gender: gender as 'M' | 'F' | 'O' | 'N',
      };
      const result = createEmployeeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid gender', () => {
    const invalidData = {
      ...validData,
      gender: 'X' as any,
    };

    const result = createEmployeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts minimal employee data', () => {
    const minimalData = {
      fullName: 'Jane Doe',
      email: 'jane@empresa.com',
      position: 'Analista',
      department: 'RH',
    };

    const result = createEmployeeSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  it('trims whitespace from text fields', () => {
    const dataWithWhitespace = {
      ...validData,
      fullName: '  João Silva Santos  ',
      position: '  Desenvolvedor  ',
    };

    const result = createEmployeeSchema.safeParse(dataWithWhitespace);
    if (result.success) {
      expect(result.data.fullName).toBe('João Silva Santos');
      expect(result.data.position).toBe('Desenvolvedor');
    }
  });
});
