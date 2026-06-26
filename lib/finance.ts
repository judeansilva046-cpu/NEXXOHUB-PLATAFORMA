export const PLATFORM_COMMISSION_RATE = 0.15;
export const EMPLOYEE_REGISTRATION_FEE = 7;

export function calculateContractRevenue(monthlyValue: number, employeeCount: number) {
  if (monthlyValue < 0 || employeeCount < 0 || !Number.isInteger(employeeCount)) {
    throw new Error('Valores financeiros inválidos.');
  }

  const commission = Number((monthlyValue * PLATFORM_COMMISSION_RATE).toFixed(2));
  const registrationFee = Number((employeeCount * EMPLOYEE_REGISTRATION_FEE).toFixed(2));

  return {
    commission,
    registrationFee,
    totalPlatformRevenue: Number((commission + registrationFee).toFixed(2)),
  };
}
