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

export type CaseOption = { id: string; label: string; companyId?: string };
export type TechnicalCaseValues = {
  id?: string;
  companyId?: string;
  employeeId?: string | null;
  title?: string;
  summary?: string | null;
  caseType?: 'monitoring' | 'help_request' | 'complaint' | 'intervention' | 'other';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'referred' | 'closed' | 'archived';
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export function TechnicalCaseEditor({
  companies,
  employees,
  initialValues,
  triggerLabel,
}: {
  companies: CaseOption[];
  employees: CaseOption[];
  initialValues?: TechnicalCaseValues;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const editing = Boolean(initialValues?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState(initialValues?.companyId || '');
  const [employeeId, setEmployeeId] = useState(initialValues?.employeeId || '');
  const [title, setTitle] = useState(initialValues?.title || '');
  const [summary, setSummary] = useState(initialValues?.summary || '');
  const [caseType, setCaseType] = useState(initialValues?.caseType || 'monitoring');
  const [riskLevel, setRiskLevel] = useState(initialValues?.riskLevel || 'medium');
  const [status, setStatus] = useState(initialValues?.status || 'open');

  const employeeOptions = useMemo(
    () => employees.filter((employee) => !companyId || employee.companyId === companyId),
    [companyId, employees]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch(
      editing ? `/api/clinic/technical-cases/${initialValues?.id}` : '/api/clinic/technical-cases',
      {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!editing && { companyId, employeeId: employeeId || null }),
          title,
          summary: summary || null,
          caseType,
          riskLevel,
          status,
        }),
      }
    );
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível salvar o caso técnico.');
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function archive() {
    if (!initialValues?.id || !window.confirm('Arquivar este caso técnico?')) return;
    setSaving(true);
    const response = await fetch(`/api/clinic/technical-cases/${initialValues.id}`, {
      method: 'DELETE',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível arquivar.');
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
          {triggerLabel || (editing ? 'Editar' : 'Novo Caso Técnico')}
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
          <DialogTitle>{editing ? 'Editar Caso Técnico' : 'Novo Caso Técnico'}</DialogTitle>
          <DialogDescription>
            Registre acompanhamento, risco, encaminhamento ou intervenção conduzida pela Clínica.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!editing && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Empresa</label>
                <select
                  value={companyId}
                  onChange={(event) => {
                    setCompanyId(event.target.value);
                    setEmployeeId('');
                  }}
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
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Colaborador monitorado
                </label>
                <select
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Caso agregado / sem colaborador individual</option>
                  {employeeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Título</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Resumo</label>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              className={`${inputClass} h-auto py-3`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Tipo</label>
              <select
                value={caseType}
                onChange={(event) => setCaseType(event.target.value as typeof caseType)}
                className={inputClass}
              >
                <option value="monitoring">Acompanhamento</option>
                <option value="help_request">Pedido de ajuda</option>
                <option value="complaint">Denúncia</option>
                <option value="intervention">Intervenção</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Risco</label>
              <select
                value={riskLevel}
                onChange={(event) => setRiskLevel(event.target.value as typeof riskLevel)}
                className={inputClass}
              >
                <option value="low">Baixo</option>
                <option value="medium">Médio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className={inputClass}
              >
                <option value="open">Aberto</option>
                <option value="in_progress">Em acompanhamento</option>
                <option value="referred">Encaminhado</option>
                <option value="closed">Encerrado</option>
                {editing && <option value="archived">Arquivado</option>}
              </select>
            </div>
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
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TechnicalCaseEventEditor({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState('technical_note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/clinic/technical-cases/${caseId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, title, description: description || null }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || 'Não foi possível registrar o evento.');
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    setTitle('');
    setDescription('');
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50">
          <Plus className="h-3.5 w-3.5" /> Evento
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-slate-200 bg-white text-slate-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar evento técnico</DialogTitle>
          <DialogDescription>
            Atendimento, observação, encaminhamento ou evidência.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className={inputClass}
          >
            <option value="attendance">Atendimento</option>
            <option value="technical_note">Observação técnica</option>
            <option value="referral">Encaminhamento</option>
            <option value="evidence">Evidência</option>
            <option value="intervention">Intervenção</option>
            <option value="status_change">Mudança de status</option>
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={3}
            placeholder="Título do evento"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Descrição técnica"
            className={`${inputClass} h-auto py-3`}
          />
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
