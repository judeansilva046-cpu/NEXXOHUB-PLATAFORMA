'use client';

import { useMemo, useState, type FormEvent } from 'react';
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
import type { LearningResource } from '../../lib/validations/clinic-learning';

export type LearningOption = {
  id: string;
  label: string;
};

export type LearningEditorValues = {
  id?: string;
  title?: string;
  description?: string | null;
  status?: 'draft' | 'active' | 'archived';
  companyId?: string | null;
  parentId?: string;
  position?: number;
  durationMinutes?: number;
  videoProvider?: 'vimeo' | null;
  videoExternalId?: string | null;
};

const resourceMeta: Record<
  LearningResource,
  { singular: string; parentLabel?: string; parentField?: string }
> = {
  programs: { singular: 'Programa' },
  tracks: { singular: 'Trilha', parentLabel: 'Programa', parentField: 'programId' },
  modules: { singular: 'Módulo', parentLabel: 'Trilha', parentField: 'trackId' },
  lessons: { singular: 'Aula', parentLabel: 'Módulo', parentField: 'moduleId' },
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';

export function LearningEditor({
  resource,
  triggerLabel,
  companies = [],
  parentOptions = [],
  initialValues,
  variant = 'primary',
}: {
  resource: LearningResource;
  triggerLabel?: string;
  companies?: LearningOption[];
  parentOptions?: LearningOption[];
  initialValues?: LearningEditorValues;
  variant?: 'primary' | 'secondary' | 'text';
}) {
  const router = useRouter();
  const meta = resourceMeta[resource];
  const editing = Boolean(initialValues?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [status, setStatus] = useState(initialValues?.status || 'draft');
  const [companyId, setCompanyId] = useState(initialValues?.companyId || '');
  const [parentId, setParentId] = useState(initialValues?.parentId || '');
  const [position, setPosition] = useState(initialValues?.position || 0);
  const [durationMinutes, setDurationMinutes] = useState(initialValues?.durationMinutes || 0);
  const [videoExternalId, setVideoExternalId] = useState(initialValues?.videoExternalId || '');
  const [hasVimeoVideo, setHasVimeoVideo] = useState(
    initialValues?.videoProvider === 'vimeo' || Boolean(initialValues?.videoExternalId)
  );

  const triggerDisabled = !editing && Boolean(meta.parentField) && parentOptions.length === 0;
  const endpoint = useMemo(
    () =>
      editing
        ? `/api/clinic/learning/${resource}/${initialValues?.id}`
        : `/api/clinic/learning/${resource}`,
    [editing, initialValues?.id, resource]
  );

  function resetCreateForm() {
    if (editing) return;
    setTitle('');
    setDescription('');
    setStatus('draft');
    setCompanyId('');
    setParentId('');
    setPosition(0);
    setDurationMinutes(0);
    setVideoExternalId('');
    setHasVimeoVideo(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Record<string, unknown> = {
      title,
      description: description || null,
      status,
    };
    if (resource === 'programs') payload.companyId = companyId || null;
    if (!editing && meta.parentField) payload[meta.parentField] = parentId;
    if (resource === 'tracks' || resource === 'modules' || resource === 'lessons') {
      payload.position = position;
    }
    if (resource === 'lessons') {
      payload.durationMinutes = durationMinutes;
      payload.videoProvider = hasVimeoVideo ? 'vimeo' : null;
      payload.videoExternalId = hasVimeoVideo ? videoExternalId || null : null;
    }

    try {
      const response = await fetch(endpoint, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'Não foi possível salvar o conteúdo.');
      setOpen(false);
      resetCreateForm();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar conteúdo.');
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!initialValues?.id || !window.confirm(`Arquivar ${meta.singular.toLowerCase()}?`)) return;
    setError(null);
    setArchiving(true);
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'Não foi possível arquivar.');
      setOpen(false);
      router.refresh();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Erro ao arquivar conteúdo.');
    } finally {
      setArchiving(false);
    }
  }

  const triggerClasses =
    variant === 'primary'
      ? 'flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45'
      : variant === 'secondary'
        ? 'flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45'
        : 'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" disabled={triggerDisabled} className={triggerClasses}>
          {editing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
          {triggerLabel || `${editing ? 'Editar' : 'Novo'} ${meta.singular}`}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 bg-white text-slate-900 sm:max-w-xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <DialogHeader>
          <DialogTitle>{editing ? `Editar ${meta.singular}` : `Novo ${meta.singular}`}</DialogTitle>
          <DialogDescription>
            Conteúdo técnico gerenciado pela Clínica e disponibilizado conforme o vínculo da
            empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor={`${resource}-title`} className={labelClass}>
              Título
            </label>
            <input
              id={`${resource}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={2}
              maxLength={160}
              className={inputClass}
            />
          </div>

          {resource === 'programs' && (
            <div>
              <label htmlFor={`${resource}-company`} className={labelClass}>
                Empresa destinatária
              </label>
              <select
                id={`${resource}-company`}
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className={inputClass}
              >
                <option value="">Biblioteca geral da clínica</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!editing && meta.parentField && (
            <div>
              <label htmlFor={`${resource}-parent`} className={labelClass}>
                {meta.parentLabel}
              </label>
              <select
                id={`${resource}-parent`}
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecione</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={`${resource}-description`} className={labelClass}>
              Descrição
            </label>
            <textarea
              id={`${resource}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={3000}
              className={`${inputClass} h-auto min-h-24 py-3`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${resource}-status`} className={labelClass}>
                Status
              </label>
              <select
                id={`${resource}-status`}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as 'draft' | 'active' | 'archived')
                }
                className={inputClass}
              >
                <option value="draft">Rascunho</option>
                <option value="active">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
            {resource !== 'programs' && (
              <div>
                <label htmlFor={`${resource}-position`} className={labelClass}>
                  Ordem
                </label>
                <input
                  id={`${resource}-position`}
                  type="number"
                  min={0}
                  max={10000}
                  value={position}
                  onChange={(event) => setPosition(Number(event.target.value))}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {resource === 'lessons' && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <label htmlFor="lesson-duration" className={labelClass}>
                  Duração estimada (minutos)
                </label>
                <input
                  id="lesson-duration"
                  type="number"
                  min={0}
                  max={1440}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(Number(event.target.value))}
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={hasVimeoVideo}
                  onChange={(event) => setHasVimeoVideo(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Esta aula possui vídeo integrado ao Vimeo
              </label>
              {hasVimeoVideo && (
                <div>
                  <label htmlFor="lesson-vimeo" className={labelClass}>
                    ID do vídeo no Vimeo
                  </label>
                  <input
                    id="lesson-vimeo"
                    value={videoExternalId}
                    onChange={(event) => setVideoExternalId(event.target.value)}
                    placeholder="Ex.: 123456789"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            {editing && initialValues?.status !== 'archived' ? (
              <button
                type="button"
                onClick={archive}
                disabled={archiving || saving}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {archiving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                Arquivar
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || archiving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
