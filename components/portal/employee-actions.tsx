'use client';

import { useState, type FormEvent } from 'react';

type SubmitState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

const initialState: SubmitState = { loading: false, message: null, error: null };

async function submitJson(url: string, formData: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Não foi possível salvar.');
  }
  return result;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Salvando...' : label}
    </button>
  );
}

function Feedback({ state }: { state: SubmitState }) {
  if (state.error) {
    return <p className="text-sm text-red-600">{state.error}</p>;
  }
  if (state.message) {
    return <p className="text-sm text-emerald-700">{state.message}</p>;
  }
  return null;
}

export function WeeklyCheckinForm() {
  const [state, setState] = useState(initialState);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ loading: true, message: null, error: null });

    try {
      await submitJson('/api/portal/employee/checkins', {
        moodScore: Number(data.get('moodScore')),
        stressScore: Number(data.get('stressScore')),
        sleepScore: Number(data.get('sleepScore')),
        comments: String(data.get('comments') || ''),
      });
      form.reset();
      setState({ loading: false, message: 'Check-in semanal salvo com sucesso.', error: null });
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : 'Erro ao salvar check-in.',
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Responder check-in semanal</h2>
        <p className="mt-1 text-sm text-slate-500">
          Resposta individual protegida por RLS e usada apenas para indicadores agregados.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Como você está?">
          <select name="moodScore" required className="w-full rounded-xl border px-3 py-2">
            <option value="5">Muito bem</option>
            <option value="4">Bem</option>
            <option value="3">Regular</option>
            <option value="2">Mal</option>
            <option value="1">Muito mal</option>
          </select>
        </Field>
        <Field label="Nível de estresse">
          <select name="stressScore" required className="w-full rounded-xl border px-3 py-2">
            <option value="1">Muito baixo</option>
            <option value="2">Baixo</option>
            <option value="3">Moderado</option>
            <option value="4">Alto</option>
            <option value="5">Muito alto</option>
          </select>
        </Field>
        <Field label="Qualidade do sono">
          <select name="sleepScore" required className="w-full rounded-xl border px-3 py-2">
            <option value="5">Muito boa</option>
            <option value="4">Boa</option>
            <option value="3">Regular</option>
            <option value="2">Ruim</option>
            <option value="1">Muito ruim</option>
          </select>
        </Field>
      </div>
      <Field label="Comentário opcional">
        <textarea name="comments" rows={3} className="w-full rounded-xl border px-3 py-2" />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton loading={state.loading} label="Salvar check-in" />
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function HelpRequestForm() {
  const [state, setState] = useState(initialState);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ loading: true, message: null, error: null });

    try {
      await submitJson('/api/portal/employee/help-requests', {
        subject: String(data.get('subject') || ''),
        description: String(data.get('description') || ''),
      });
      form.reset();
      setState({ loading: false, message: 'Pedido de ajuda enviado ao RH.', error: null });
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : 'Erro ao enviar pedido.',
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Novo pedido de ajuda</h2>
        <p className="mt-1 text-sm text-slate-500">
          O pedido é identificado e segue o fluxo Colaborador → RH → Tratativa → Encerramento.
        </p>
      </div>
      <Field label="Assunto">
        <input name="subject" required className="w-full rounded-xl border px-3 py-2" />
      </Field>
      <Field label="Descrição">
        <textarea
          name="description"
          required
          rows={4}
          className="w-full rounded-xl border px-3 py-2"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton loading={state.loading} label="Enviar pedido" />
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function ComplaintForm() {
  const [state, setState] = useState(initialState);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ loading: true, message: null, error: null });

    try {
      await submitJson('/api/portal/employee/complaints', {
        category: String(data.get('category') || ''),
        description: String(data.get('description') || ''),
        isAnonymous: data.get('isAnonymous') === 'on',
      });
      form.reset();
      setState({ loading: false, message: 'Denúncia registrada com segurança.', error: null });
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : 'Erro ao registrar denúncia.',
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Registrar denúncia</h2>
        <p className="mt-1 text-sm text-slate-500">
          Você pode escolher denúncia anônima ou identificada. O acesso fica restrito à governança
          autorizada.
        </p>
      </div>
      <Field label="Categoria">
        <input name="category" required className="w-full rounded-xl border px-3 py-2" />
      </Field>
      <Field label="Descrição">
        <textarea
          name="description"
          required
          rows={4}
          className="w-full rounded-xl border px-3 py-2"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input name="isAnonymous" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
        Enviar como denúncia anônima
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton loading={state.loading} label="Registrar denúncia" />
        <Feedback state={state} />
      </div>
    </form>
  );
}
