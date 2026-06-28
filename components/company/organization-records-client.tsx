'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type {
  CompanyOrganizationResource,
  RecordStatusInput,
} from '../../lib/validations/company-organization-records';

export type OrganizationRecordStatus = RecordStatusInput;

export type BranchRecord = {
  id: string;
  name: string;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  status: OrganizationRecordStatus;
  created_at: string;
  updated_at: string;
};

export type DepartmentRecord = {
  id: string;
  name: string;
  branch_id: string | null;
  branch_name: string | null;
  status: OrganizationRecordStatus;
  created_at: string;
  updated_at: string;
};

export type PositionRecord = {
  id: string;
  name: string;
  cbo_code: string | null;
  department_id: string | null;
  department_name: string | null;
  status: OrganizationRecordStatus;
  created_at: string;
  updated_at: string;
};

export type EmployeeRecord = {
  id: string;
  full_name: string;
  email: string;
  cpf: string | null;
  registration: string | null;
  position: string;
  department: string | null;
  phone: string | null;
  admission_date: string | null;
  branch_id: string | null;
  branch_name: string | null;
  department_id: string | null;
  department_name: string | null;
  position_id: string | null;
  position_name: string | null;
  status: OrganizationRecordStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyOrganizationRecord =
  | BranchRecord
  | DepartmentRecord
  | PositionRecord
  | EmployeeRecord;

export type OrganizationHistoryEvent = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  description: string | null;
  occurred_at: string;
};

export type OrganizationReferences = {
  branches: Array<Pick<BranchRecord, 'id' | 'name' | 'status'>>;
  departments: Array<Pick<DepartmentRecord, 'id' | 'name' | 'branch_id' | 'status'>>;
  positions: Array<Pick<PositionRecord, 'id' | 'name' | 'department_id' | 'status'>>;
};

type FormState = {
  id?: string;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  address: string;
  branchId: string;
  departmentId: string;
  positionId: string;
  cboCode: string;
  fullName: string;
  cpf: string;
  registration: string;
  email: string;
  phone: string;
  admissionDate: string;
  department: string;
  position: string;
  status: OrganizationRecordStatus;
};

const pageSize = 10;

const labels: Record<
  CompanyOrganizationResource,
  { singular: string; plural: string; create: string; empty: string }
> = {
  branches: {
    singular: 'filial',
    plural: 'filiais',
    create: 'Nova filial',
    empty: 'Nenhuma filial cadastrada ainda.',
  },
  departments: {
    singular: 'departamento',
    plural: 'departamentos',
    create: 'Novo departamento',
    empty: 'Nenhum departamento cadastrado ainda.',
  },
  positions: {
    singular: 'cargo',
    plural: 'cargos',
    create: 'Novo cargo',
    empty: 'Nenhum cargo cadastrado ainda.',
  },
  employees: {
    singular: 'colaborador',
    plural: 'colaboradores',
    create: 'Novo colaborador',
    empty: 'Nenhum colaborador cadastrado ainda.',
  },
};

const statusLabels: Record<OrganizationRecordStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  archived: 'Arquivado',
};

function blankForm(): FormState {
  return {
    name: '',
    cnpj: '',
    city: '',
    state: '',
    address: '',
    branchId: '',
    departmentId: '',
    positionId: '',
    cboCode: '',
    fullName: '',
    cpf: '',
    registration: '',
    email: '',
    phone: '',
    admissionDate: '',
    department: '',
    position: '',
    status: 'active',
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

function getRecordTitle(resource: CompanyOrganizationResource, record: CompanyOrganizationRecord) {
  if (resource === 'employees') return (record as EmployeeRecord).full_name;
  return (record as BranchRecord | DepartmentRecord | PositionRecord).name;
}

function getSearchText(record: CompanyOrganizationRecord) {
  return Object.values(record)
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

function statusBadge(status: OrganizationRecordStatus) {
  const color =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === 'inactive'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-slate-50 text-slate-700 ring-slate-200';

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${color}`}>
      {statusLabels[status]}
    </span>
  );
}

function recordToForm(
  resource: CompanyOrganizationResource,
  record: CompanyOrganizationRecord
): FormState {
  const form = blankForm();
  form.id = record.id;
  form.status = record.status;

  if (resource === 'branches') {
    const branch = record as BranchRecord;
    return {
      ...form,
      name: branch.name,
      cnpj: branch.cnpj || '',
      city: branch.city || '',
      state: branch.state || '',
      address: branch.address || '',
    };
  }

  if (resource === 'departments') {
    const department = record as DepartmentRecord;
    return {
      ...form,
      name: department.name,
      branchId: department.branch_id || '',
    };
  }

  if (resource === 'positions') {
    const position = record as PositionRecord;
    return {
      ...form,
      name: position.name,
      cboCode: position.cbo_code || '',
      departmentId: position.department_id || '',
    };
  }

  const employee = record as EmployeeRecord;
  return {
    ...form,
    fullName: employee.full_name,
    cpf: employee.cpf || '',
    registration: employee.registration || '',
    email: employee.email,
    phone: employee.phone || '',
    admissionDate: employee.admission_date || '',
    branchId: employee.branch_id || '',
    departmentId: employee.department_id || '',
    positionId: employee.position_id || '',
    department: employee.department || '',
    position: employee.position || '',
  };
}

function getResponseMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const response = payload as { message?: string; error?: { message?: string } };
  return response.message || response.error?.message || fallback;
}

function resolveDepartmentName(references: OrganizationReferences, departmentId: string) {
  return references.departments.find((department) => department.id === departmentId)?.name || '';
}

function resolvePositionName(references: OrganizationReferences, positionId: string) {
  return references.positions.find((position) => position.id === positionId)?.name || '';
}

export function OrganizationRecordsClient({
  resource,
  title,
  subtitle,
  initialRecords,
  references,
  history,
  canManage,
}: {
  resource: CompanyOrganizationResource;
  title: string;
  subtitle: string;
  initialRecords: CompanyOrganizationRecord[];
  references: OrganizationReferences;
  history: OrganizationHistoryEvent[];
  canManage: boolean;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | OrganizationRecordStatus>('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyOrganizationRecord | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = status === 'all' || record.status === status;
      const matchesQuery = !normalizedQuery || getSearchText(record).includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [query, records, status]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visibleRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const activeCount = records.filter((record) => record.status === 'active').length;
  const inactiveCount = records.filter((record) => record.status === 'inactive').length;
  const archivedCount = records.filter((record) => record.status === 'archived').length;

  const endpoint = `/api/company/organization-records/${resource}`;

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      const payload = await response.json();
      if (!response.ok)
        throw new Error(getResponseMessage(payload, 'Erro ao atualizar registros.'));
      setRecords(payload.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar registros.');
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm());
    setDialogOpen(true);
  };

  const openEdit = (record: CompanyOrganizationRecord) => {
    setEditing(record);
    setForm(recordToForm(resource, record));
    setDialogOpen(true);
  };

  const buildPayload = () => {
    if (resource === 'branches') {
      return {
        id: form.id,
        name: form.name,
        cnpj: form.cnpj,
        city: form.city,
        state: form.state,
        address: form.address,
        status: form.status,
      };
    }

    if (resource === 'departments') {
      return {
        id: form.id,
        name: form.name,
        branchId: form.branchId || null,
        status: form.status,
      };
    }

    if (resource === 'positions') {
      return {
        id: form.id,
        name: form.name,
        cboCode: form.cboCode,
        departmentId: form.departmentId || null,
        status: form.status,
      };
    }

    return {
      id: form.id,
      fullName: form.fullName,
      cpf: form.cpf,
      registration: form.registration,
      email: form.email,
      phone: form.phone,
      admissionDate: form.admissionDate || undefined,
      branchId: form.branchId || null,
      departmentId: form.departmentId || null,
      positionId: form.positionId || null,
      department: form.departmentId
        ? resolveDepartmentName(references, form.departmentId)
        : form.department,
      position: form.positionId ? resolvePositionName(references, form.positionId) : form.position,
      status: form.status,
    };
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getResponseMessage(payload, 'Não foi possível salvar.'));

      toast.success(`${labels[resource].singular} salvo com sucesso.`);
      setDialogOpen(false);
      setEditing(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (
    record: CompanyOrganizationRecord,
    nextStatus: OrganizationRecordStatus
  ) => {
    setActionId(record.id);
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, status: nextStatus }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(getResponseMessage(payload, 'Não foi possível alterar status.'));

      toast.success(`Status alterado para ${statusLabels[nextStatus].toLowerCase()}.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar status.');
    } finally {
      setActionId(null);
    }
  };

  const filteredDepartments = form.branchId
    ? references.departments.filter(
        (department) => !department.branch_id || department.branch_id === form.branchId
      )
    : references.departments;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/company/organization"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Importação em lote
          </Link>
          {canManage && (
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
              {labels[resource].create}
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Total', records.length],
          ['Ativos', activeCount],
          ['Inativos', inactiveCount],
          ['Arquivados', archivedCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      {!canManage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Seu perfil pode consultar estes dados. Alterações ficam restritas a Admin da Empresa e RH.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Lista de {labels[resource].plural}
            </h2>
            <p className="text-sm text-slate-500">
              {filteredRecords.length} resultado(s) em {records.length} registro(s).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar..."
              className="sm:w-72"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as 'all' | OrganizationRecordStatus);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="archived">Arquivados</option>
            </select>
          </div>
        </div>

        {loading && records.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Carregando registros...</div>
        ) : visibleRecords.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">{labels[resource].empty}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {resource === 'employees' ? (
                  <>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Nome</TableHead>
                    {resource === 'branches' && <TableHead>CNPJ</TableHead>}
                    {resource === 'branches' && <TableHead>Cidade/UF</TableHead>}
                    {resource === 'departments' && <TableHead>Filial</TableHead>}
                    {resource === 'positions' && <TableHead>Departamento</TableHead>}
                    {resource === 'positions' && <TableHead>CBO</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRecords.map((record) => (
                <TableRow key={record.id}>
                  {resource === 'employees' ? (
                    <>
                      <TableCell className="font-medium">
                        {(record as EmployeeRecord).full_name}
                      </TableCell>
                      <TableCell>{(record as EmployeeRecord).email}</TableCell>
                      <TableCell>{(record as EmployeeRecord).registration || '—'}</TableCell>
                      <TableCell>{(record as EmployeeRecord).branch_name || '—'}</TableCell>
                      <TableCell>
                        {(record as EmployeeRecord).department_name ||
                          (record as EmployeeRecord).department ||
                          '—'}
                      </TableCell>
                      <TableCell>
                        {(record as EmployeeRecord).position_name ||
                          (record as EmployeeRecord).position ||
                          '—'}
                      </TableCell>
                      <TableCell>{statusBadge(record.status)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">
                        {getRecordTitle(resource, record)}
                      </TableCell>
                      {resource === 'branches' && (
                        <TableCell>{(record as BranchRecord).cnpj || '—'}</TableCell>
                      )}
                      {resource === 'branches' && (
                        <TableCell>
                          {[(record as BranchRecord).city, (record as BranchRecord).state]
                            .filter(Boolean)
                            .join(' / ') || '—'}
                        </TableCell>
                      )}
                      {resource === 'departments' && (
                        <TableCell>{(record as DepartmentRecord).branch_name || 'Todas'}</TableCell>
                      )}
                      {resource === 'positions' && (
                        <TableCell>
                          {(record as PositionRecord).department_name || 'Todos'}
                        </TableCell>
                      )}
                      {resource === 'positions' && (
                        <TableCell>{(record as PositionRecord).cbo_code || '—'}</TableCell>
                      )}
                      <TableCell>{statusBadge(record.status)}</TableCell>
                      <TableCell>{formatDate(record.updated_at)}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      {canManage ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEdit(record)}>
                            Editar
                          </Button>
                          {record.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionId === record.id}
                              onClick={() => changeStatus(record, 'inactive')}
                            >
                              {resource === 'employees' ? 'Desligar' : 'Inativar'}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionId === record.id}
                              onClick={() => changeStatus(record, 'active')}
                            >
                              Reativar
                            </Button>
                          )}
                          {record.status !== 'archived' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionId === record.id}
                              onClick={() => changeStatus(record, 'archived')}
                            >
                              Arquivar
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Somente leitura</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Página {page} de {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Histórico recente</h2>
        <p className="mt-1 text-sm text-slate-500">
          Eventos persistidos em banco para auditoria dos registros desta área.
        </p>
        {history.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Nenhum evento registrado ainda.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {history.slice(0, 8).map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">{event.event_type}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDate(event.occurred_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar ${labels[resource].singular}` : labels[resource].create}
            </DialogTitle>
            <DialogDescription>
              Os dados serão salvos no Supabase e auditados por usuário e tenant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-4">
            {resource === 'branches' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome da filial"
                  value={form.name}
                  onChange={(value) => setField('name', value)}
                  required
                />
                <Field
                  label="CNPJ"
                  value={form.cnpj}
                  onChange={(value) => setField('cnpj', value)}
                />
                <Field
                  label="Cidade"
                  value={form.city}
                  onChange={(value) => setField('city', value)}
                />
                <Field
                  label="UF"
                  value={form.state}
                  onChange={(value) => setField('state', value.toUpperCase().slice(0, 2))}
                />
                <div className="md:col-span-2">
                  <Field
                    label="Endereço"
                    value={form.address}
                    onChange={(value) => setField('address', value)}
                  />
                </div>
              </div>
            )}

            {resource === 'departments' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome do departamento"
                  value={form.name}
                  onChange={(value) => setField('name', value)}
                  required
                />
                <SelectField
                  label="Filial"
                  value={form.branchId}
                  onChange={(value) => setField('branchId', value)}
                >
                  <option value="">Todas/sem filial</option>
                  {references.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            )}

            {resource === 'positions' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome do cargo"
                  value={form.name}
                  onChange={(value) => setField('name', value)}
                  required
                />
                <Field
                  label="Código CBO"
                  value={form.cboCode}
                  onChange={(value) => setField('cboCode', value)}
                />
                <SelectField
                  label="Departamento vinculado"
                  value={form.departmentId}
                  onChange={(value) => setField('departmentId', value)}
                >
                  <option value="">Todos/sem departamento</option>
                  {references.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            )}

            {resource === 'employees' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome completo"
                  value={form.fullName}
                  onChange={(value) => setField('fullName', value)}
                  required
                />
                <Field
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(value) => setField('email', value)}
                  required
                />
                <Field
                  label="CPF"
                  value={form.cpf}
                  onChange={(value) => setField('cpf', value)}
                  required
                />
                <Field
                  label="Matrícula"
                  value={form.registration}
                  onChange={(value) => setField('registration', value)}
                  required
                />
                <Field
                  label="Telefone"
                  value={form.phone}
                  onChange={(value) => setField('phone', value)}
                />
                <Field
                  label="Admissão"
                  type="date"
                  value={form.admissionDate}
                  onChange={(value) => setField('admissionDate', value)}
                />
                <SelectField
                  label="Filial"
                  value={form.branchId}
                  onChange={(value) => setField('branchId', value)}
                >
                  <option value="">Sem filial</option>
                  {references.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Departamento"
                  value={form.departmentId}
                  onChange={(value) => setField('departmentId', value)}
                >
                  <option value="">Sem departamento</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </SelectField>
                {!form.departmentId && (
                  <Field
                    label="Departamento manual"
                    value={form.department}
                    onChange={(value) => setField('department', value)}
                  />
                )}
                <SelectField
                  label="Cargo"
                  value={form.positionId}
                  onChange={(value) => setField('positionId', value)}
                >
                  <option value="">Cargo manual</option>
                  {references.positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </SelectField>
                {!form.positionId && (
                  <Field
                    label="Cargo manual"
                    value={form.position}
                    onChange={(value) => setField('position', value)}
                    required
                  />
                )}
              </div>
            )}

            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => setField('status', value as OrganizationRecordStatus)}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="archived">Arquivado</option>
            </SelectField>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <Input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        {children}
      </select>
    </label>
  );
}
