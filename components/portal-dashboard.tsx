'use client';

import { Activity, Building2, ClipboardCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PortalType } from '../lib/portal';

const icons = [Building2, Users, ClipboardCheck, Activity];

export function PortalDashboard({
  portal,
  title,
  subtitle,
}: {
  portal: Exclude<PortalType, 'nexxohub'>;
  title: string;
  subtitle: string;
}) {
  const [data, setData] = useState<{
    role: string;
    metrics: Array<{ label: string; value: number }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/summary?portal=${portal}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Erro ao carregar');
        return result.data;
      })
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, [portal]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-slate-600">{subtitle}</p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {!data ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
          Carregando dados reais...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric, index) => {
              const Icon = icons[index];
              return (
                <section
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Icon className="h-7 w-7 text-blue-600" />
                  <p className="mt-4 text-sm text-slate-600">{metric.label}</p>
                  <p className="mt-1 text-3xl font-bold text-slate-950">
                    {metric.value.toLocaleString('pt-BR')}
                  </p>
                </section>
              );
            })}
          </div>
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Os indicadores serão preenchidos automaticamente conforme os registros reais deste
              portal.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
