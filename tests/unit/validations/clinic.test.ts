import { describe, it, expect } from 'vitest';
import { createClinicSchema } from '../../../lib/validations/clinic';

describe('Clinic Validation Schema', () => {
  it('validates correct clinic data', () => {
    const validData = {
      name: 'Clínica ABC',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 3333-3333',
      address: 'Rua A, 123',
    };

    const result = createClinicSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      name: 'Clínica ABC',
      // missing cnpj, phone, address
    };

    const result = createClinicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid CNPJ format', () => {
    const invalidData = {
      name: 'Clínica ABC',
      cnpj: 'invalid',
      phone: '(11) 3333-3333',
      address: 'Rua A, 123',
    };

    const result = createClinicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects name shorter than 3 characters', () => {
    const invalidData = {
      name: 'AB',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 3333-3333',
      address: 'Rua A, 123',
    };

    const result = createClinicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('trims whitespace from fields', () => {
    const dataWithWhitespace = {
      name: '  Clínica ABC  ',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 3333-3333',
      address: '  Rua A, 123  ',
    };

    const result = createClinicSchema.safeParse(dataWithWhitespace);
    if (result.success) {
      expect(result.data.name).toBe('Clínica ABC');
      expect(result.data.address).toBe('Rua A, 123');
    }
  });
});
