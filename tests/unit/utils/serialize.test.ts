import { describe, it, expect } from 'vitest';
import { serialize, toSnakeCase } from '../../../lib/serialize';

describe('serialize utilities', () => {
  it('converts snake_case to camelCase', () => {
    const result = serialize({
      full_name: 'João',
      organization_id: 'abc-123',
      created_at: '2026-01-01',
    });

    expect(result).toEqual({
      fullName: 'João',
      organizationId: 'abc-123',
      createdAt: '2026-01-01',
    });
  });

  it('converts camelCase to snake_case', () => {
    const result = toSnakeCase({
      fullName: 'João',
      birthDate: '1990-01-01',
    });

    expect(result).toEqual({
      full_name: 'João',
      birth_date: '1990-01-01',
    });
  });
});
