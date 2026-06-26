'use client';

import { useEffect, useState } from 'react';
type Company = { id: string; name: string };
type Document = {
  id: string;
  title: string;
  document_type: string;
  status: string;
  companies: { name: string } | null;
  created_at: string;
};
export default function DocumentsPage() {
  const [items, setItems] = useState<Document[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({ companyId: '', documentType: 'nr1_evidence', title: '' });
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    const [a, b] = await Promise.all([fetch('/api/documents'), fetch('/api/companies')]);
    const [ra, rb] = await Promise.all([a.json(), b.json()]);
    if (!a.ok) throw new Error(ra.error);
    setItems(ra.data || []);
    setCompanies(rb.data || []);
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) return setError(result.error);
    setForm({ companyId: '', documentType: 'nr1_evidence', title: '' });
    await load();
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentos</h1>
        <p className="mt-2 text-slate-600">
          Registro documental real. Upload será habilitado após configuração segura do Storage.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-4">
        <select
          value={form.companyId}
          onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          className="rounded-xl border p-3"
        >
          <option value="">Sem empresa específica</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={form.documentType}
          onChange={(e) => setForm({ ...form, documentType: e.target.value })}
          className="rounded-xl border p-3"
        >
          <option value="nr1_evidence">Evidência NR-1</option>
          <option value="contract">Contrato</option>
          <option value="report">Relatório</option>
          <option value="other">Outro</option>
        </select>
        <input
          required
          placeholder="Título do documento"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-xl border p-3"
        />
        <button className="rounded-xl bg-blue-600 p-3 font-semibold text-white">
          Registrar documento
        </button>
      </form>
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
      <div className="rounded-2xl border bg-white p-5">
        {items.length === 0 ? (
          <p className="py-10 text-center text-slate-500">Nenhum documento registrado.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex justify-between border-b py-4">
              <span>
                <b>{item.title}</b>
                <small className="ml-2 text-slate-500">{item.companies?.name || 'Geral'}</small>
              </span>
              <span className="text-sm text-slate-500">{item.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
