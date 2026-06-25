export type UserRole = 'admin' | 'manager' | 'user';

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
  description?: string;
  cnpj: string;
  website?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Clinic {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  cnpj: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  cnpj: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  position: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}
