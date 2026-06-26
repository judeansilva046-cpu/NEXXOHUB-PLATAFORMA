import { describe, expect, it } from 'vitest';
import { createCompanySchema } from '../../../lib/validations/company';

const validCompany = {
  clinicId: '11111111-1111-4111-8111-111111111111',
  legalName: 'Tech Company Serviços LTDA',
  name: 'Tech Company',
  cnpj: '12.345.678/0001-99',
  hrResponsible: 'Carlos Lima',
  email: 'rh@company.com',
  phone: '(11) 3333-3333',
  address: 'Avenida Principal, 500',
  employeeCount: 120,
  status: 'active' as const,
};

describe('Company Validation Schema', () => {
  it('validates complete company data', () => {
    expect(createCompanySchema.safeParse(validCompany).success).toBe(true);
  });

  it('rejects missing legal name', () => {
    const invalid = { ...validCompany } as Partial<typeof validCompany>;
    delete invalid.legalName;
    expect(createCompanySchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(createCompanySchema.safeParse({ ...validCompany, email: 'invalid' }).success).toBe(
      false
    );
  });

  it('rejects invalid CNPJ format', () => {
    expect(createCompanySchema.safeParse({ ...validCompany, cnpj: 'invalid' }).success).toBe(false);
  });

  it('rejects negative employee count', () => {
    expect(createCompanySchema.safeParse({ ...validCompany, employeeCount: -1 }).success).toBe(
      false
    );
  });

  it('coerces employee count received from form input', () => {
    const result = createCompanySchema.parse({ ...validCompany, employeeCount: '25' });
    expect(result.employeeCount).toBe(25);
  });
});
