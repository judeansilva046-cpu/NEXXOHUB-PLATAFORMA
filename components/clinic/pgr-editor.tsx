'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Loader2, Pencil, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

type CompanyOption = { id: string; label: string };
type PgrValues = {
  id?: string;
  companyId?: string;
  title?: string;
  description?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  status?: 'draft' | 'published' | 'archived';
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export function PgrEditor({
  companies,
  initialValues,
  triggerLabel,
}: {
  companies: CompanyOption[];
  initialValues?: PgrValues;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const editing = Boolean(initialValues?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState(initialValues?.companyId || '');
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [periodStart, setPeriodStart] = useState(initialValues?.periodStart || '');
  const [periodEnd, setPeriodEnd] = useState(initialValues?.periodEnd || '');
  const [status, setStatus] = useState(initialValues?.status || 'draft');
  const [changeSummary, setChangeSummary] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch(
      editing ? `/api/clinic/pgr/${initialValues?.id}` : '/api/clinic/pgr',
      {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!editing && { companyId }),
          title,
          description: description || null,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          status,
          changeSummary: changeSummary || (editing ? 'PGR atualizado' : 'Versão inicial'),
          content: {},
        }),
      }
    );
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível salvar o PGR.');
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function archive() {
    if (!initialValues?.id || !window.confirm('Arquivar este PGR?')) return;
    setSaving(true);
    const response = await fetch(`/api/clinic/pgr/${initialValues.id}`, { method: 'DELETE' });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível arquivar o PGR.');
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={!editing && companies.length === 0}
          className={
            editing
              ? 'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50'
              : 'flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-45'
          }
        >
          {editing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
          {triggerLabel || (editing ? 'Editar' : 'Novo PGR')}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 bg-white text-slate-900 sm:max-w-xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <DialogHeader>
          <DialogTitle>{editing ? 'Atualizar PGR' : 'Criar PGR'}</DialogTitle>
          <DialogDescription>
            Cada atualização gera automaticamente uma nova versão no histórico oficial.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!editing && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Empresa</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecione</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`${inputClass} h-auto py-3`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Início do período
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Fim do período
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className={inputClass}
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              {editing && <option value="archived">Arquivado</option>}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Resumo das alterações
            </label>
            <input
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="O que mudou nesta versão?"
              className={inputClass}
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            {editing && initialValues?.status !== 'archived' ? (
              <button
                type="button"
                onClick={archive}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600"
              >
                <Archive className="h-4 w-4" /> Arquivar
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving
                ? 'Salvando...'
                : status === 'published'
                  ? 'Salvar e publicar'
                  : 'Salvar versão'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
