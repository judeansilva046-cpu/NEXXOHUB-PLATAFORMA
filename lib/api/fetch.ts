import { ApiResponse } from '@/types';

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || `Erro na requisição (${res.status})`);
  }

  return json.data as T;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: async (url: string) => {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || json.message || `Erro na requisição (${res.status})`);
    }
    return json;
  },
};
