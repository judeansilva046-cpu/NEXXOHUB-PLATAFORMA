export type UserRole = 'admin' | 'manager' | 'user';
export type RecordStatus = 'active' | 'inactive' | 'archived';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  responsibleName?: string;
  email?: string;
  cnpj: string;
  phone?: string;
  address?: string;
  status?: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Clinic {
  id: string;
  organizationId: string;
  name: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  address: string;
  specialties: string[];
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  organizationId: string;
  clinicId: string;
  clinicName?: string;
  legalName: string;
  name: string;
  cnpj: string;
  hrResponsible: string;
  email: string;
  phone: string;
  address: string;
  employeeCount: number;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  organizationId: string;
  companyId: string;
  companyName?: string;
  fullName: string;
  cpf: string;
  registration: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  admissionDate: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; field?: string };
}
