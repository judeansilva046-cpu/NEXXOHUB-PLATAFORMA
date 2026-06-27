import Link from 'next/link';

export type PortalColumn<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
};

export function RecordsPage<T>({
  title,
  subtitle,
  records,
  columns,
  emptyMessage,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  records: T[];
  columns: Array<PortalColumn<T>>;
  emptyMessage: string;
  action?: { label: string; href: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>
        {action && (
          <Link
            href={action.href}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {action.label}
          </Link>
        )}
      </div>

      {children}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {records.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.header}
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {records.map((record, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column.header} className="px-5 py-4 text-sm text-slate-700">
                        {column.render(record)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status || 'sem status';
  const color =
    status === 'active' || status === 'open' || status === 'generated'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === 'closed' || status === 'archived'
        ? 'bg-slate-50 text-slate-700 ring-slate-200'
        : 'bg-amber-50 text-amber-700 ring-amber-200';

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${color}`}>{label}</span>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}
