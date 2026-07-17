'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateTechnicalCaseButton({ url }: { url: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(url, { method: 'POST' });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setError(result?.error || result?.message || 'Nao foi possivel criar o caso.');
      setLoading(false);
      return;
    }

    const caseId = result.data?.id;
    if (caseId) {
      router.push(`/clinic/cases?case=${caseId}`);
      return;
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-fit rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Criando caso...' : 'Criar caso tecnico'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
