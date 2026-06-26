'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateContractRevenue } from '../../../lib/finance';

type Option = { id: string; name: string };
type Contract = {
  id: string;
  contract_number: string;
  monthly_value: number;
  covered_employees: number;
  expected_platform_revenue: number;
  status: string;
  starts_on: string;
  clinics: { name: string } | null;
  companies: { name: string } | null;
};

const emptyForm = {
  clinicId: '',
  companyId: '',
  contractNumber: '',
  startsOn: '',
  endsOn: '',
  monthlyValue: 0,
  coveredEmployees: 0,
  status: 'draft',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clinics, setClinics] = useState<Option[]>([]);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [contractResponse, clinicResponse, companyResponse] = await Promise.all([
      fetch('/api/contracts', { cache: 'no-store' }),
      fetch('/api/clinics', { cache: 'no-store' }),
      fetch('/api/companies', { cache: 'no-store' }),
    ]);
    const [contractResult, clinicResult, companyResult] = await Promise.all([
      contractResponse.json(),
      clinicResponse.json(),
      companyResponse.json(),
    ]);
    if (!contractResponse.ok) throw new Error(contractResult.error || 'Erro ao carregar contratos');
    setContracts(contractResult.data || []);
    setClinics(clinicResult.data || []);
    setCompanies(companyResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((reason) => {
      setError(reason instanceof Error ? reason.message : 'Erro ao carregar');
      setLoading(false);
    });
  }, []);

  const preview = useMemo(
    () => calculateContractRevenue(Number(form.monthlyValue), Number(form.coveredEmployees)),
    [form.monthlyValue, form.coveredEmployees]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error || 'Não foi possível cadastrar o contrato');
      return;
    }
    setForm(emptyForm);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Contratos</h1>
        <p className="mt-2 text-slate-600">Contratos reais entre clínicas e empresas.</p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4"
      >
        <select
          required
          value={form.clinicId}
          onChange={(e) => setForm({ ...form, clinicId: e.target.value })}
          className="rounded-xl border p-3"
        >
          <option value="">Selecione a clínica</option>
          {clinics.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          required
          value={form.companyId}
          onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          className="rounded-xl border p-3"
        >
          <option value="">Selecione a empresa</option>
          {companies.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Número do contrato"
          value={form.contractNumber}
          onChange={(e) => setForm({ ...form, contractNumber: e.target.value })}
          className="rounded-xl border p-3"
        />
        <input
          required
          type="date"
          value={form.startsOn}
          onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
          className="rounded-xl border p-3"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Valor mensal"
          value={form.monthlyValue}
          onChange={(e) => setForm({ ...form, monthlyValue: Number(e.target.value) })}
          className="rounded-xl border p-3"
        />
        <input
          type="number"
          min="0"
          placeholder="Colaboradores cobertos"
          value={form.coveredEmployees}
          onChange={(e) => setForm({ ...form, coveredEmployees: Number(e.target.value) })}
          className="rounded-xl border p-3"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="rounded-xl border p-3"
        >
          <option value="draft">Rascunho</option>
          <option value="active">Ativo</option>
          <option value="suspended">Suspenso</option>
          <option value="expired">Expirado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <button
          disabled={saving}
          className="rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Cadastrar contrato'}
        </button>
        <div className="md:col-span-2 xl:col-span-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
          Receita prevista: 15% ={' '}
          {preview.commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} +
          taxa de cadastro ={' '}
          {preview.registrationFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.
          Total:{' '}
          <b>
            {preview.totalPlatformRevenue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </b>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-white">
            <tr>
              <th className="p-4">Contrato</th>
              <th>Clínica</th>
              <th>Empresa</th>
              <th>Mensalidade</th>
              <th>Receita NexxoHub</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && contracts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  Nenhum contrato cadastrado.
                </td>
              </tr>
            )}
            {contracts.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-4 font-medium">{item.contract_number}</td>
                <td>{item.clinics?.name || '—'}</td>
                <td>{item.companies?.name || '—'}</td>
                <td>
                  {Number(item.monthly_value).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
                <td>
                  {Number(item.expected_platform_revenue).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
