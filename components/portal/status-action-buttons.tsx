'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ActionState = {
  loading: string | null;
  error: string | null;
};

type StatusAction = {
  label: string;
  status: string;
  tone?: 'dark' | 'blue' | 'green';
};

async function patchStatus(url: string, status: string) {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Nao foi possivel atualizar.');
  }
}

export function StatusActionButtons({
  url,
  currentStatus,
  actions,
}: {
  url: string;
  currentStatus: string;
  actions: StatusAction[];
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ loading: null, error: null });
  const availableActions = actions.filter((action) => action.status !== currentStatus);

  if (!availableActions.length || currentStatus === 'closed') {
    return <span className="text-xs text-slate-400">Sem acoes</span>;
  }

  const onClick = async (status: string) => {
    setState({ loading: status, error: null });

    try {
      await patchStatus(url, status);
      setState({ loading: null, error: null });
      router.refresh();
    } catch (error) {
      setState({
        loading: null,
        error: error instanceof Error ? error.message : 'Erro ao atualizar.',
      });
    }
  };

  const colors = {
    dark: 'bg-slate-950 text-white hover:bg-slate-800',
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };

  return (
    <div className="flex min-w-32 flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {availableActions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => onClick(action.status)}
            disabled={Boolean(state.loading)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${colors[action.tone || 'dark']}`}
          >
            {state.loading === action.status ? 'Salvando...' : action.label}
          </button>
        ))}
      </div>
      {state.error && <span className="text-[10px] text-red-600">{state.error}</span>}
    </div>
  );
}
