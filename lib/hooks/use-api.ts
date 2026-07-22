'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/fetch';
import {
  Clinic,
  Company,
  Employee,
  Organization,
  Assessment,
  Report,
  User,
} from '@/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<User & { fullName?: string }>('/api/auth/me'),
  });
}

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get<Organization>('/api/organizations'),
  });
}

export function useClinics() {
  return useQuery({
    queryKey: ['clinics'],
    queryFn: () => api.get<Clinic[]>('/api/clinics'),
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get<Company[]>('/api/companies'),
  });
}

export function useEmployees(companyId?: string) {
  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: () =>
      api.get<Employee[]>(
        companyId ? `/api/employees?companyId=${companyId}` : '/api/employees'
      ),
  });
}

export function useAssessments() {
  return useQuery({
    queryKey: ['assessments'],
    queryFn: () => api.get<Assessment[]>('/api/assessments'),
  });
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get<Report[]>('/api/reports'),
  });
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return (keys: string[]) => {
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };
}

export function useClinicMutations() {
  const invalidate = useInvalidateQueries();
  return {
    create: useMutation({
      mutationFn: (data: unknown) => api.post<Clinic>('/api/clinics', data),
      onSuccess: () => invalidate(['clinics']),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: unknown }) =>
        api.put<Clinic>(`/api/clinics/${id}`, data),
      onSuccess: () => invalidate(['clinics']),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/api/clinics/${id}`),
      onSuccess: () => invalidate(['clinics']),
    }),
  };
}

export function useCompanyMutations() {
  const invalidate = useInvalidateQueries();
  return {
    create: useMutation({
      mutationFn: (data: unknown) => api.post<Company>('/api/companies', data),
      onSuccess: () => invalidate(['companies']),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: unknown }) =>
        api.put<Company>(`/api/companies/${id}`, data),
      onSuccess: () => invalidate(['companies']),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/api/companies/${id}`),
      onSuccess: () => invalidate(['companies']),
    }),
  };
}

export function useAssessmentMutations() {
  const invalidate = useInvalidateQueries();
  return {
    create: useMutation({
      mutationFn: (data: unknown) => api.post<Assessment>('/api/assessments', data),
      onSuccess: () => invalidate(['assessments']),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: unknown }) =>
        api.put<Assessment>(`/api/assessments/${id}`, data),
      onSuccess: () => invalidate(['assessments']),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/api/assessments/${id}`),
      onSuccess: () => invalidate(['assessments']),
    }),
  };
}

export function useReportMutations() {
  const invalidate = useInvalidateQueries();
  return {
    create: useMutation({
      mutationFn: (data: unknown) => api.post<Report>('/api/reports', data),
      onSuccess: () => invalidate(['reports']),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/api/reports/${id}`),
      onSuccess: () => invalidate(['reports']),
    }),
  };
}
