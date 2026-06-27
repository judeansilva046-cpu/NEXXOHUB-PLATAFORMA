'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, History, PlugZap, UploadCloud } from 'lucide-react';
import {
  quickImportConfigs,
  quickImportTypeLabels,
  quickImportTypes,
  type QuickImportType,
} from '../../lib/quick-onboarding/config';

type CompanyOption = {
  id: string;
  name: string;
  legal_name?: string | null;
  cnpj?: string | null;
  status?: string | null;
};

type ImportHistoryRow = {
  id: string;
  import_type: QuickImportType;
  status: string;
  original_filename: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  created_at: string;
  completed_at?: string | null;
  companies?: { name: string } | { name: string }[] | null;
};

type PreviewRow = {
  rowNumber: number;
  values: Record<string, string | number | null>;
  errors: Array<{ message: string; field?: string }>;
  warnings: Array<{ message: string; field?: string }>;
};

type PreviewResult = {
  importId: string;
  canConfirm: boolean;
  previewRows: PreviewRow[];
  issues: Array<{
    rowNumber: number;
    field?: string;
    code: string;
    message: string;
    severity: 'warning' | 'error';
  }>;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errorCount: number;
    warningCount: number;
    pendingStructure: {
      branches: string[];
      departments: string[];
      positions: string[];
    };
  };
};

export function QuickOnboardingClient({
  companies,
  imports,
  integrations,
}: {
  companies: CompanyOption[];
  imports: ImportHistoryRow[];
  integrations: { connectionsCount: number; syncLogsCount: number };
}) {
  const [type, setType] = useState<QuickImportType>('employees');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [createMissingStructure, setCreateMissingStructure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = quickImportConfigs[type];
  const previewColumns = useMemo(() => config.columns.slice(0, 8), [config.columns]);

  const runPreview = async () => {
    setError(null);
    setMessage(null);
    setPreview(null);

    if (!file) {
      setError('Selecione um arquivo .csv, .xlsx ou .xls.');
      return;
    }

    if (config.requiresCompany && !companyId) {
      setError('Selecione uma empresa cliente.');
      return;
    }

    const formData = new FormData();
    formData.set('type', type);
    if (companyId) formData.set('companyId', companyId);
    formData.set('createMissingStructure', String(createMissingStructure));
    formData.set('file', file);

    setLoading(true);
    try {
      const response = await fetch('/api/clinic/quick-onboarding/imports/preview', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Não foi possível validar o arquivo.');
      }
      setPreview(result.data);
      setMessage(
        result.data.canConfirm
          ? 'Prévia gerada sem erros bloqueantes. Confira os dados e confirme a importação.'
          : 'Prévia gerada com erros. Corrija o arquivo antes de importar.'
      );
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Erro ao validar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!preview?.importId) return;
    setConfirming(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/clinic/quick-onboarding/imports/${preview.importId}/confirm`,
        { method: 'POST' }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Não foi possível confirmar a importação.');
      }
      setMessage(`Importação concluída. Registros criados: ${result.data.createdCount}.`);
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (confirmError) {
      setError(
        confirmError instanceof Error ? confirmError.message : 'Erro ao confirmar importação.'
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
              <UploadCloud className="h-4 w-4" /> Implantação Rápida
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Importação em massa pela clínica
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Cadastre empresas, filiais, departamentos, cargos e colaboradores com validação real,
              preview antes de salvar, Storage, RLS e histórico auditável.
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <strong>Escala:</strong> arquivos de até 5.000 linhas por validação síncrona.
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-950">Novo upload</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Tipo de importação
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as QuickImportType);
                  setPreview(null);
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                {quickImportTypes.map((item) => (
                  <option key={item} value={item}>
                    {quickImportTypeLabels[item]}
                  </option>
                ))}
              </select>
            </label>

            {config.requiresCompany && (
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Empresa cliente
                <select
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <p className="mt-4 text-sm text-slate-500">{config.description}</p>

          {type === 'employees' && (
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
              <input
                type="checkbox"
                checked={createMissingStructure}
                onChange={(event) => setCreateMissingStructure(event.target.checked)}
                className="mt-1"
              />
              <span>
                Criar automaticamente filiais, departamentos e cargos inexistentes durante a
                importação de colaboradores.
              </span>
            </label>
          )}

          <label className="mt-4 block rounded-2xl border border-dashed border-slate-300 p-6 text-center">
            <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
            <span className="mt-2 block text-sm font-medium text-slate-700">
              Selecione um arquivo .csv, .xlsx ou .xls
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            {file && <span className="mt-2 block text-xs text-slate-500">{file.name}</span>}
          </label>

          <button
            onClick={runPreview}
            disabled={loading}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Validando arquivo...' : 'Validar e gerar prévia'}
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-950">Templates</h2>
          </div>
          <div className="space-y-3">
            {quickImportTypes.map((item) => (
              <Link
                key={item}
                href={`/api/clinic/quick-onboarding/templates/${item}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm hover:border-blue-300 hover:bg-blue-50"
              >
                <span>{quickImportTypeLabels[item]}</span>
                <Download className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(message || error) && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {error || message}
        </div>
      )}

      {preview && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Prévia da importação</h2>
              <p className="text-sm text-slate-500">Importação #{preview.importId}</p>
            </div>
            <button
              onClick={confirmImport}
              disabled={!preview.canConfirm || confirming}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? 'Importando...' : 'Confirmar importação'}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            <Metric label="Linhas" value={preview.summary.totalRows} />
            <Metric label="Válidas" value={preview.summary.validRows} />
            <Metric label="Com erro" value={preview.summary.invalidRows} />
            <Metric label="Erros" value={preview.summary.errorCount} />
            <Metric label="Avisos" value={preview.summary.warningCount} />
          </div>

          {(preview.summary.pendingStructure.branches.length > 0 ||
            preview.summary.pendingStructure.departments.length > 0 ||
            preview.summary.pendingStructure.positions.length > 0) && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Estrutura pendente detectada:</strong>{' '}
              {[
                preview.summary.pendingStructure.branches.length
                  ? `${preview.summary.pendingStructure.branches.length} filial(is)`
                  : null,
                preview.summary.pendingStructure.departments.length
                  ? `${preview.summary.pendingStructure.departments.length} departamento(s)`
                  : null,
                preview.summary.pendingStructure.positions.length
                  ? `${preview.summary.pendingStructure.positions.length} cargo(s)`
                  : null,
              ]
                .filter(Boolean)
                .join(', ')}
              .
            </div>
          )}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Linha</th>
                  {previewColumns.map((column) => (
                    <th key={column.key} className="px-3 py-2">
                      {column.header}
                    </th>
                  ))}
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="px-3 py-2 font-medium">{row.rowNumber}</td>
                    {previewColumns.map((column) => (
                      <td key={column.key} className="px-3 py-2 text-slate-700">
                        {String(row.values[column.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {row.errors.length ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                          erro
                        </span>
                      ) : row.warnings.length ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                          aviso
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                          ok
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.issues.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200">
              <div className="border-b px-4 py-3 font-semibold text-slate-950">
                Erros e avisos por linha
              </div>
              <div className="max-h-72 divide-y overflow-auto">
                {preview.issues.map((issue, index) => (
                  <div
                    key={`${issue.rowNumber}-${issue.code}-${index}`}
                    className="px-4 py-3 text-sm"
                  >
                    <span
                      className={`mr-2 rounded-full px-2 py-1 text-xs ${
                        issue.severity === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      linha {issue.rowNumber}
                    </span>
                    {issue.field && <strong>{issue.field}: </strong>}
                    {issue.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.45fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-950">Histórico de importações</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Empresa</th>
                  <th className="px-3 py-2">Linhas</th>
                  <th className="px-3 py-2">Criados</th>
                  <th className="px-3 py-2">Erros</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {imports.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2">{quickImportTypeLabels[item.import_type]}</td>
                    <td className="px-3 py-2">{companyName(item.companies)}</td>
                    <td className="px-3 py-2">{item.total_rows}</td>
                    <td className="px-3 py-2">{item.created_count}</td>
                    <td className="px-3 py-2">{item.error_count}</td>
                    <td className="px-3 py-2">{statusLabel(item.status)}</td>
                  </tr>
                ))}
                {!imports.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      Nenhuma importação registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <PlugZap className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-950">RH/ERP</h2>
          </div>
          <p className="text-sm text-slate-600">
            Estrutura técnica criada para conexões, webhooks, tokens, mapeamento de campos, logs de
            sincronização, fila e retry.
          </p>
          <div className="mt-5 grid gap-3">
            <Metric label="Conexões configuradas" value={integrations.connectionsCount} />
            <Metric label="Logs de sincronização" value={integrations.syncLogsCount} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function companyName(value: ImportHistoryRow['companies']) {
  if (!value) return '—';
  if (Array.isArray(value)) return value[0]?.name || '—';
  return value.name || '—';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    uploaded: 'Enviado',
    previewed: 'Prévia',
    ready: 'Pronto',
    processing: 'Processando',
    completed: 'Concluído',
    completed_with_errors: 'Concluído com avisos',
    failed: 'Falhou',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}
