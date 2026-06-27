import { requireNexxoHubRole } from '../../lib/nexxohub-context';

type ContractRow = {
  id: string;
  status: string;
  expected_platform_revenue: number | string | null;
  platform_commission: number | string | null;
  employee_registration_fee: number | string | null;
  clinics: { name: string } | { name: string }[] | null;
  companies: { name: string } | { name: string }[] | null;
};

type InvoiceRow = {
  amount: number | string;
  status: string;
  due_date: string;
  paid_at: string | null;
};

type PaymentRow = {
  amount: number | string;
  status: string;
  paid_at: string | null;
};

type SubscriptionRow = {
  status: string;
  clinics: { name: string } | { name: string }[] | null;
  billing_plans:
    | { name: string; monthly_price: number | string }
    | { name: string; monthly_price: number | string }[]
    | null;
};

export default async function FinancePage() {
  const { supabase } = await requireNexxoHubRole(['nexxohub_admin', 'nexxohub_finance']);

  const [
    { data: contracts },
    { data: invoices },
    { data: payments },
    { data: subscriptions },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select(
        'id, status, expected_platform_revenue, platform_commission, employee_registration_fee, clinics(name), companies(name)'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('amount, status, due_date, paid_at')
      .order('due_date', { ascending: false }),
    supabase
      .from('payments')
      .select('amount, status, paid_at')
      .order('paid_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('status, clinics(name), billing_plans(name, monthly_price)')
      .order('created_at', { ascending: false }),
    supabase.from('billing_plans').select('name, monthly_price, is_active').order('monthly_price'),
  ]);

  const contractRows = (contracts || []) as unknown as ContractRow[];
  const invoiceRows = (invoices || []) as InvoiceRow[];
  const paymentRows = (payments || []) as PaymentRow[];
  const subscriptionRows = (subscriptions || []) as unknown as SubscriptionRow[];
  const today = new Date().toISOString().slice(0, 10);

  const activeSubscriptions = subscriptionRows.filter((item) =>
    ['trialing', 'active'].includes(item.status)
  );
  const cancelledSubscriptions = subscriptionRows.filter((item) => item.status === 'cancelled');
  const mrr = activeSubscriptions.reduce(
    (sum, item) => sum + moneyNumber(firstRelation(item.billing_plans)?.monthly_price),
    0
  );
  const arr = mrr * 12;
  const contractRevenue = contractRows.reduce(
    (sum, item) => sum + moneyNumber(item.expected_platform_revenue),
    0
  );
  const paidInvoices = invoiceRows
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + moneyNumber(item.amount), 0);
  const confirmedPayments = paymentRows
    .filter((item) => item.status === 'confirmed')
    .reduce((sum, item) => sum + moneyNumber(item.amount), 0);
  const totalRevenue = Math.max(contractRevenue, paidInvoices + confirmedPayments);
  const receivable = invoiceRows
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + moneyNumber(item.amount), 0);
  const overdue = invoiceRows
    .filter(
      (item) => item.status === 'overdue' || (item.status === 'pending' && item.due_date < today)
    )
    .reduce((sum, item) => sum + moneyNumber(item.amount), 0);
  const churnRate = subscriptionRows.length
    ? cancelledSubscriptions.length / subscriptionRows.length
    : 0;
  const averageTicket = activeSubscriptions.length ? mrr / activeSubscriptions.length : 0;
  const ltv = churnRate > 0 ? averageTicket / churnRate : averageTicket * 12;

  const revenueByPlan = new Map<string, number>();
  for (const item of activeSubscriptions) {
    const plan = firstRelation(item.billing_plans);
    const name = plan?.name || 'Sem plano';
    revenueByPlan.set(name, (revenueByPlan.get(name) || 0) + moneyNumber(plan?.monthly_price));
  }

  const revenueByClinic = new Map<string, number>();
  for (const item of activeSubscriptions) {
    const clinic = firstRelation(item.clinics);
    const plan = firstRelation(item.billing_plans);
    const name = clinic?.name || 'Sem clínica';
    revenueByClinic.set(name, (revenueByClinic.get(name) || 0) + moneyNumber(plan?.monthly_price));
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-slate-950">Portal Financeiro NexxoHub</h1>
        <p className="mt-2 text-slate-600">
          Indicadores calculados em tempo real a partir de contratos, planos, assinaturas, faturas e
          pagamentos.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="MRR" value={currency(mrr)} />
        <Metric label="ARR" value={currency(arr)} />
        <Metric label="Receita total" value={currency(totalRevenue)} />
        <Metric label="Ticket médio" value={currency(averageTicket)} />
        <Metric label="Contas a receber" value={currency(receivable)} />
        <Metric
          label="Inadimplência"
          value={currency(overdue)}
          tone={overdue > 0 ? 'danger' : 'default'}
        />
        <Metric label="Churn" value={`${(churnRate * 100).toFixed(1)}%`} />
        <Metric label="LTV estimado" value={currency(ltv)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Breakdown title="Receita por plano" items={Array.from(revenueByPlan.entries())} />
        <Breakdown title="Receita por clínica" items={Array.from(revenueByClinic.entries())} />
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Contratos recentes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Clínica</th>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Receita prevista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractRows.slice(0, 12).map((contract) => (
                <tr key={contract.id}>
                  <td className="px-3 py-2">{firstRelation(contract.clinics)?.name || '—'}</td>
                  <td className="px-3 py-2">{firstRelation(contract.companies)?.name || '—'}</td>
                  <td className="px-3 py-2">{contract.status}</td>
                  <td className="px-3 py-2 font-semibold">
                    {currency(moneyNumber(contract.expected_platform_revenue))}
                  </td>
                </tr>
              ))}
              {!contractRows.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                    Nenhum contrato financeiro cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Planos cadastrados</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(plans || []).map(
            (plan: { name: string; monthly_price: number | string; is_active: boolean }) => (
              <div key={plan.name} className="rounded-xl border p-4">
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-2 text-2xl font-bold">
                  {currency(moneyNumber(plan.monthly_price))}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            )
          )}
          {!(plans || []).length && (
            <p className="text-sm text-slate-500">Nenhum plano cadastrado ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${tone === 'danger' ? 'border-red-200' : ''}`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold ${tone === 'danger' ? 'text-red-600' : 'text-slate-950'}`}
      >
        {value}
      </p>
    </div>
  );
}

function Breakdown({ title, items }: { title: string; items: Array<[string, number]> }) {
  const sorted = [...items].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {sorted.map(([name, value]) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <span className="text-sm text-slate-700">{name}</span>
            <strong>{currency(value)}</strong>
          </div>
        ))}
        {!sorted.length && (
          <p className="py-6 text-center text-sm text-slate-500">Sem dados financeiros ainda.</p>
        )}
      </div>
    </div>
  );
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function moneyNumber(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
