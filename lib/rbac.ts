import type { PortalType } from './portal';

export const portalRoles = {
  nexxohub: ['nexxohub_admin', 'nexxohub_operator'],
  clinic: ['clinic_admin', 'clinic_staff'],
  company: [
    'company_admin',
    'company_director',
    'company_hr',
    'company_compliance',
    'company_governance',
    'company_manager',
  ],
  employee: ['employee'],
} as const satisfies Record<PortalType, readonly string[]>;

export type NexxoHubRole = (typeof portalRoles)[keyof typeof portalRoles][number];

export const legacyRoleAliases: Record<string, NexxoHubRole> = {
  super_admin: 'nexxohub_admin',
  admin: 'nexxohub_admin',
  financeiro: 'nexxohub_operator',
  comercial: 'nexxohub_operator',
  suporte: 'nexxohub_operator',
  tecnologia: 'nexxohub_operator',
  clinic_financial: 'clinic_staff',
  clinic_professional: 'clinic_staff',
  psychologist: 'clinic_staff',
  analyst: 'clinic_staff',
  hr: 'company_hr',
  compliance: 'company_compliance',
  director: 'company_director',
  manager: 'company_manager',
};

export function normalizeRole(role: string): NexxoHubRole | string {
  return legacyRoleAliases[role] || role;
}

export function roleBelongsToPortal(role: string, portal: PortalType) {
  const normalizedRole = normalizeRole(role);
  return (portalRoles[portal] as readonly string[]).includes(normalizedRole);
}
