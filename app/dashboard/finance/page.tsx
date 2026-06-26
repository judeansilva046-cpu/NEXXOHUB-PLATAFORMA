'use client';

import { useEffect, useMemo, useState } from 'react';

type Contract = {
  id: string;
  status: string;
  platform_commission: number;
  employee_registration_fee: number;
  expected_platform_revenue: number;
  companies: { name: string } | null;
  clinics: { name: string } | null;
};

export default function FinancePage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/contracts', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setItems(result.data || []);
      })
      .catch((reason) => setError(reason.message || 'Erro ao carregar financeiro'));
  }, []);
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          commission: acc.commission + Number(item.platform_commission || 0),
          registration: acc.registration + Number(item.employee_registration_fee || 0),
          revenue: acc.revenue + Number(item.expected_platform_revenue || 0),
        }),
        { commission: 0, registration: 0, revenue: 0 }
      ),
    [items]
  );
  const money = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="mt-2 text-slate-600">
          Valores calculados diretamente dos contratos cadastrados.
        </p>
      </div>
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Comissão mensal de 15%', totals.commission],
          ['Taxas de colaboradores', totals.registration],
          ['Receita prevista', totals.revenue],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{money(Number(value))}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Composição por contrato</h2>
        {items.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            Cadastre um contrato para gerar os indicadores financeiros.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-2 rounded-xl border p-4 sm:flex-row"
              >
                <span>
                  {item.companies?.name || 'Empresa'} • {item.clinics?.name || 'Clínica'}
                </span>
                <b>{money(Number(item.expected_platform_revenue))}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
