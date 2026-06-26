type Row = Record<string, unknown>;

export function mapClinic(row: Row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    cnpj: row.cnpj,
    responsibleName: row.responsible_name || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    specialties: row.specialties || [],
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCompany(row: Row) {
  const clinic = row.clinics as { name?: string } | null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    clinicId: row.clinic_id,
    clinicName: clinic?.name || '',
    legalName: row.legal_name || '',
    name: row.name,
    cnpj: row.cnpj,
    hrResponsible: row.hr_responsible || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    employeeCount: row.employee_count || 0,
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEmployee(row: Row) {
  const company = row.companies as { name?: string } | null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    companyId: row.company_id,
    companyName: company?.name || '',
    fullName: row.full_name,
    cpf: row.cpf || '',
    registration: row.registration || '',
    position: row.position,
    department: row.department || '',
    email: row.email,
    phone: row.phone || '',
    admissionDate: row.admission_date || '',
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
