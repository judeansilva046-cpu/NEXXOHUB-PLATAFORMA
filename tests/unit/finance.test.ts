import { describe, expect, it } from 'vitest';
import { calculateContractRevenue } from '../../lib/finance';

describe('cálculo financeiro de contratos', () => {
  it('calcula 15% sobre o valor mensal', () => {
    expect(calculateContractRevenue(1000, 0).commission).toBe(150);
  });

  it('calcula a taxa única de R$ 7 por colaborador', () => {
    expect(calculateContractRevenue(0, 10).registrationFee).toBe(70);
  });

  it('soma comissão e taxa de cadastro', () => {
    expect(calculateContractRevenue(2000, 20).totalPlatformRevenue).toBe(440);
  });

  it('rejeita valores inválidos', () => {
    expect(() => calculateContractRevenue(-1, 1)).toThrow();
    expect(() => calculateContractRevenue(1, 1.5)).toThrow();
  });
});
