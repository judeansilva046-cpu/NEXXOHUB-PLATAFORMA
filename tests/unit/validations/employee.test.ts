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

  it('rejects name shorter than 2 characters', () => {
    const invalidData = {
      ...validData,
      fullName: 'J',
    };

    const result = createEmployeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts optional birth date as string', () => {
    const data = {
      ...validData,
      birthDate: '1990-05-15',
    };

    const result = createEmployeeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts valid gender values', () => {
    const genders = ['M', 'F', 'O', 'N'];

    genders.forEach((gender) => {
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
      gender: 'X' as 'M',
    };

    const result = createEmployeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts minimal employee data', () => {
    const minimalData = {
      fullName: 'Jane Doe',
      email: 'jane@empresa.com',
      position: 'Analista',
    };

    const result = createEmployeeSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });
});
