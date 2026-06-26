import { describe, expect, it } from 'vitest';
import { createClinicSchema } from '../../../lib/validations/clinic';

const validClinic = {
  name: 'Clínica Bem Viver',
  cnpj: '12.345.678/0001-99',
  responsibleName: 'Maria Souza',
  email: 'contato@bemviver.com.br',
  phone: '(11) 3333-3333',
  address: 'Rua A, 123',
  specialties: 'Psicologia, Psiquiatria',
  status: 'active' as const,
};

describe('Clinic Validation Schema', () => {
  it('validates complete clinic data', () => {
    expect(createClinicSchema.safeParse(validClinic).success).toBe(true);
  });

  it('rejects missing responsible and contact fields', () => {
    const invalid = { ...validClinic } as Partial<typeof validClinic>;
    delete invalid.responsibleName;
    expect(createClinicSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects invalid CNPJ format', () => {
    expect(createClinicSchema.safeParse({ ...validClinic, cnpj: 'invalid' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(createClinicSchema.safeParse({ ...validClinic, email: 'invalid' }).success).toBe(false);
  });

  it('trims whitespace from text fields', () => {
    const result = createClinicSchema.parse({ ...validClinic, name: '  Clínica Bem Viver  ' });
    expect(result.name).toBe('Clínica Bem Viver');
  });
});
