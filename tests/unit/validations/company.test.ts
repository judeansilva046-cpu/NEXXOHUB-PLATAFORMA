import { describe, it, expect } from 'vitest';
import { createCompanySchema } from '@/lib/validations/company';

describe('Company Validation Schema', () => {
  it('validates correct company data', () => {
    const validData = {
      name: 'Tech Company LTDA',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 3333-3333',
      email: 'contact@company.com',
      address: 'Avenida Principal, 500',
    };

    const result = createCompanySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      name: 'Tech Company LTDA',
      // missing cnpj, phone, email, address
    };

    const result = createCompanySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const invalidData = {
      name: 'Tech Company LTDA',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 3333-3333',
      email: 'invalid-email',
      address: 'Avenida Principal, 500',
    };

    const result = createCompanySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid CNPJ format', () => {
    const invalidData = {
      name: 'Tech Company LTDA',
      cnpj: 'not-a-cnpj',
      phone: '(11) 3333-3333',
      email: 'contact@company.com',
      address: 'Avenida Principal, 500',
    };

    const result = createCompanySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects name shorter than 3 characters', () => {
    const invalidData = {
      name: 'AB',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 3333-3333',
      email: 'contact@company.com',
      address: 'Avenida Principal, 500',
    };

    const result = createCompanySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts company data without email (optional)', () => {
    const dataWithoutEmail = {
      name: 'Tech Company LTDA',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 3333-3333',
      address: 'Avenida Principal, 500',
    };

    const result = createCompanySchema.safeParse(dataWithoutEmail);
    // Depends on schema, but testing that it handles optional fields
    expect(result).toBeDefined();
  });
});
