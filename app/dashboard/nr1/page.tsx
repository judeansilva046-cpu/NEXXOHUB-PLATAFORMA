'use client';

import { useEffect, useState } from 'react';

type Company = { id: string; name: string };
type Factor = {
  id: string;
  code: string;
  name: string;
  category: string;
  severity: string;
  companies: { name: string } | null;
};
export default function Nr1Page() {
  const [items, setItems] = useState<Factor[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    companyId: '',
    code: '',
    name: '',
    category: '',
    severity: 'medium',
  });
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    const [a, b] = await Promise.all([fetch('/api/risk-factors'), fetch('/api/companies')]);
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
    const response = await fetch('/api/risk-factors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) return setError(result.error || 'Erro ao cadastrar');
    setForm({ companyId: '', code: '', name: '', category: '', severity: 'medium' });
    await load();
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">NR-1 • Fatores de risco</h1>
        <p className="mt-2 text-slate-600">Cadastro real dos fatores psicossociais monitorados.</p>
      </div>
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2 xl:grid-cols-5"
      >
        <select
          value={form.companyId}
          onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          className="rounded-xl border p-3"
        >
          <option value="">Todas as empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Código"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="rounded-xl border p-3"
        />
        <input
          required
          placeholder="Fator de risco"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border p-3"
        />
        <input
          required
          placeholder="Categoria"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-xl border p-3"
        />
        <button className="rounded-xl bg-blue-600 p-3 font-semibold text-white">
          Cadastrar fator
        </button>
      </form>
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
      <div className="rounded-2xl border bg-white p-5">
        {items.length === 0 ? (
          <p className="py-10 text-center text-slate-500">Nenhum fator de risco cadastrado.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex justify-between border-b py-4">
              <span>
                <b>{item.code}</b> • {item.name}
                <small className="ml-2 text-slate-500">{item.companies?.name || 'Geral'}</small>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{item.severity}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
