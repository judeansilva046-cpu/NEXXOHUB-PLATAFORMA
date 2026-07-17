'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type SubmitState = {
  loading: boolean;
  error: string | null;
  message: string | null;
};

export function TreatmentNoteForm({ url }: { url: string }) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>({
    loading: false,
    error: null,
    message: null,
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ loading: true, error: null, message: null });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(data.get('title') || ''),
        description: String(data.get('description') || ''),
      }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setState({
        loading: false,
        error: result?.error || 'Nao foi possivel registrar a nota.',
        message: null,
      });
      return;
    }

    form.reset();
    setState({ loading: false, error: null, message: 'Nota registrada.' });
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        name="title"
        required
        minLength={3}
        maxLength={120}
        placeholder="Titulo da nota"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <textarea
        name="description"
        required
        minLength={5}
        maxLength={2000}
        rows={4}
        placeholder="Descreva a observacao, encaminhamento ou contato realizado"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={state.loading}
          className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.loading ? 'Registrando...' : 'Registrar nota'}
        </button>
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        {state.message && <span className="text-xs text-emerald-700">{state.message}</span>}
      </div>
    </form>
  );
}
