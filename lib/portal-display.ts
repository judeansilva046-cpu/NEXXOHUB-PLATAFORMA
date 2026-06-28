export function portalRoleLabel(role: string) {
  const labels: Record<string, string> = {
    nexxohub_admin: 'Super Administrador',
    nexxohub_finance: 'Financeiro',
    nexxohub_operator: 'Operador',
    clinic_admin: 'Administrador',
    clinic_staff: 'Equipe da clínica',
    company_admin: 'Administrador',
    company_director: 'Diretoria',
    company_hr: 'Recursos Humanos',
    company_compliance: 'Compliance',
    company_governance: 'Governança',
    company_manager: 'Gestor',
    employee: 'Colaborador',
  };

  return labels[role] || role.split('_').join(' ');
}

export function userDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const metadataName = user.user_metadata?.full_name;
  return typeof metadataName === 'string' && metadataName.trim()
    ? metadataName
    : user.email?.split('@')[0] || 'Usuário NexxoHub';
}
