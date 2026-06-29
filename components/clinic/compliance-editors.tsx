'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, FileCheck2, Loader2, Pencil, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

export type CompanyOption = { id: string; label: string };
export type EvidenceValues = {
  id?: string;
  companyId?: string;
  title?: string;
  description?: string | null;
  evidenceDate?: string | null;
  storagePath?: string | null;
  evidenceType?:
    | 'document'
    | 'meeting_minutes'
    | 'training_record'
    | 'attendance_record'
    | 'technical_note'
    | 'photo'
    | 'other';
  relatedTo?: 'nr1' | 'pgr' | 'technical_case' | 'action_plan' | 'training' | 'other';
};
export type DossierValues = {
  id?: string;
  companyId?: string;
  title?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: 'draft' | 'generated' | 'archived';
  storagePath?: string | null;
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const primaryButton =
  'flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50';
const editButton =
  'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50';

export function EvidenceEditor({
  companies,
  initialValues,
  triggerLabel,
}: {
  companies: CompanyOption[];
  initialValues?: EvidenceValues;
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
  const [evidenceDate, setEvidenceDate] = useState(initialValues?.evidenceDate || '');
  const [storagePath, setStoragePath] = useState(initialValues?.storagePath || '');
  const [evidenceType, setEvidenceType] = useState(initialValues?.evidenceType || 'document');
  const [relatedTo, setRelatedTo] = useState(initialValues?.relatedTo || 'nr1');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch(
      editing ? `/api/clinic/evidences/${initialValues?.id}` : '/api/clinic/evidences',
      {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          title,
          description: description || null,
          evidenceDate: evidenceDate || null,
          storagePath: storagePath || null,
          evidenceType,
          relatedTo,
        }),
      }
    );
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível salvar a evidência.');
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function archive() {
    if (!initialValues?.id || !window.confirm('Arquivar esta evidência?')) return;
    setSaving(true);
    const response = await fetch(`/api/clinic/evidences/${initialValues.id}`, {
      method: 'DELETE',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível arquivar a evidência.');
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
          className={editing ? editButton : primaryButton}
        >
          {editing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
          {triggerLabel || (editing ? 'Editar' : 'Nova Evidência')}
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
          <DialogTitle>{editing ? 'Editar Evidência' : 'Registrar Evidência'}</DialogTitle>
          <DialogDescription>
            Registre documentos, atas, treinamentos e notas que sustentam o dossiê NR-1.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Empresa">
            <select
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
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
          </Field>
          <Field label="Título">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Data">
              <input
                type="date"
                value={evidenceDate}
                onChange={(event) => setEvidenceDate(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Tipo">
              <select
                value={evidenceType}
                onChange={(event) => setEvidenceType(event.target.value as typeof evidenceType)}
                className={inputClass}
              >
                <option value="document">Documento</option>
                <option value="meeting_minutes">Ata</option>
                <option value="training_record">Treinamento</option>
                <option value="attendance_record">Atendimento</option>
                <option value="technical_note">Nota técnica</option>
                <option value="photo">Foto</option>
                <option value="other">Outro</option>
              </select>
            </Field>
            <Field label="Vinculado a">
              <select
                value={relatedTo}
                onChange={(event) => setRelatedTo(event.target.value as typeof relatedTo)}
                className={inputClass}
              >
                <option value="nr1">NR-1</option>
                <option value="pgr">PGR</option>
                <option value="technical_case">Caso técnico</option>
                <option value="action_plan">Plano de ação</option>
                <option value="training">Treinamento</option>
                <option value="other">Outro</option>
              </select>
            </Field>
          </div>
          <Field label="Link ou caminho do arquivo">
            <input
              value={storagePath}
              onChange={(event) => setStoragePath(event.target.value)}
              placeholder="Ex.: evidencias/empresa/arquivo.pdf"
              className={inputClass}
            />
          </Field>
          <Field label="Descrição">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className={`${inputClass} h-auto py-3`}
            />
          </Field>
          {error && <ErrorBox message={error} />}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            {editing ? (
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
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DossierEditor({
  companies,
  initialValues,
  triggerLabel,
}: {
  companies: CompanyOption[];
  initialValues?: DossierValues;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const editing = Boolean(initialValues?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState(initialValues?.companyId || '');
  const [title, setTitle] = useState(initialValues?.title || '');
  const [periodStart, setPeriodStart] = useState(initialValues?.periodStart || '');
  const [periodEnd, setPeriodEnd] = useState(initialValues?.periodEnd || '');
  const [status, setStatus] = useState(initialValues?.status || 'generated');
  const [storagePath, setStoragePath] = useState(initialValues?.storagePath || '');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch(
      editing ? `/api/clinic/nr1-dossiers/${initialValues?.id}` : '/api/clinic/nr1-dossiers',
      {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!editing && { companyId }),
          title,
          periodStart,
          periodEnd,
          status,
          storagePath: storagePath || null,
        }),
      }
    );
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível salvar o dossiê.');
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function archive() {
    if (!initialValues?.id || !window.confirm('Arquivar este dossiê NR-1?')) return;
    setSaving(true);
    const response = await fetch(`/api/clinic/nr1-dossiers/${initialValues.id}`, {
      method: 'DELETE',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível arquivar o dossiê.');
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
          className={editing ? editButton : primaryButton}
        >
          {editing ? <Pencil className="h-3.5 w-3.5" /> : <FileCheck2 className="h-4 w-4" />}
          {triggerLabel || (editing ? 'Editar' : 'Gerar Dossiê NR-1')}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 bg-white text-slate-900 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Dossiê NR-1' : 'Gerar Dossiê NR-1'}</DialogTitle>
          <DialogDescription>
            Consolide o período auditável da empresa com PGR, evidências e ações técnicas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!editing && (
            <Field label="Empresa">
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
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
            </Field>
          )}
          <Field label="Título">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Início do período">
              <input
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Fim do período">
              <input
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className={inputClass}
              >
                <option value="draft">Rascunho</option>
                <option value="generated">Gerado</option>
                {editing && <option value="archived">Arquivado</option>}
              </select>
            </Field>
            <Field label="Arquivo gerado">
              <input
                value={storagePath}
                onChange={(event) => setStoragePath(event.target.value)}
                placeholder="Ex.: dossies/empresa/maio-2026.pdf"
                className={inputClass}
              />
            </Field>
          </div>
          {error && <ErrorBox message={error} />}
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
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Salvando...' : status === 'generated' ? 'Salvar e gerar' : 'Salvar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {message}
    </div>
  );
}
