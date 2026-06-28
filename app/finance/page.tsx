import {
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  FileWarning,
  Landmark,
  ReceiptText,
} from 'lucide-react';
import { DonutChart, TrendChart, type DonutItem } from '../../components/workspace/charts';
import { MetricCard } from '../../components/workspace/metric-card';
import { PageHeader } from '../../components/workspace/page-header';
import { EmptyWorkspaceState, StatusPill, WorkspacePanel } from '../../components/workspace/panel';
import { requireNexxoHubRole } from '../../lib/nexxohub-context';

type InvoiceRow = {
  id: string;
  amount: number | string;
  status: string;
  due_date: string;
  reference_month: string;
  paid_at: string | null;
  contracts:
    | { clinics: { name: string } | { name: string }[] | null }
    | { clinics: { name: string } | { name: string }[] | null }[]
    | null;
};
type PaymentRow = {
  amount: number | string;
  status: string;
  payment_method: string | null;
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

const colors = ['#7658df', '#2f76d2', '#2a9688', '#f59e0b', '#ef4444'];

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

function invoiceClinic(invoice: InvoiceRow) {
  return firstRelation(firstRelation(invoice.contracts)?.clinics)?.name || 'Clínica';
}

export default async function FinancePage() {
  const { supabase } = await requireNexxoHubRole(['nexxohub_admin', 'nexxohub_finance']);
  const [{ data: invoices }, { data: payments }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, amount, status, due_date, reference_month, paid_at, contracts(clinics(name))')
      .order('due_date', { ascending: false }),
    supabase
      .from('payments')
      .select('amount, status, payment_method, paid_at')
      .order('paid_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('status, clinics(name), billing_plans(name, monthly_price)')
      .order('created_at', { ascending: false }),
  ]);

  const invoiceRows = (invoices || []) as unknown as InvoiceRow[];
  const paymentRows = (payments || []) as PaymentRow[];
  const subscriptionRows = (subscriptions || []) as unknown as SubscriptionRow[];
  const activeSubscriptions = subscriptionRows.filter((item) =>
    ['trialing', 'active'].includes(item.status)
  );
  const cancelledSubscriptions = subscriptionRows.filter((item) => item.status === 'cancelled');
  const mrr = activeSubscriptions.reduce(
    (sum, item) => sum + moneyNumber(firstRelation(item.billing_plans)?.monthly_price),
    0
  );
  const arr = mrr * 12;
  const averageTicket = activeSubscriptions.length ? mrr / activeSubscriptions.length : 0;
  const churnRate = subscriptionRows.length
    ? (cancelledSubscriptions.length / subscriptionRows.length) * 100
    : 0;
  const today = new Date().toISOString().slice(0, 10);
  const overdueRows = invoiceRows.filter(
    (item) => item.status === 'overdue' || (item.status === 'pending' && item.due_date < today)
  );
  const overdue = overdueRows.reduce((sum, item) => sum + moneyNumber(item.amount), 0);
  const paid = paymentRows
    .filter((item) => item.status === 'confirmed')
    .reduce((sum, item) => sum + moneyNumber(item.amount), 0);

  const planMap = new Map<string, number>();
  for (const item of activeSubscriptions) {
    const plan = firstRelation(item.billing_plans);
    const name = plan?.name || 'Sem plano';
    planMap.set(name, (planMap.get(name) || 0) + moneyNumber(plan?.monthly_price));
  }
  const planData: DonutItem[] = Array.from(planMap.entries()).map(([label, value], index) => ({
    label,
    value,
    color: colors[index % colors.length],
  }));

  const invoiceStatus: DonutItem[] = [
    {
      label: 'Pagas',
      value: invoiceRows.filter((item) => item.status === 'paid').length,
      color: '#12a36d',
    },
    {
      label: 'A vencer',
      value: invoiceRows.filter((item) => item.status === 'pending' && item.due_date >= today)
        .length,
      color: '#f5a308',
    },
    { label: 'Atrasadas', value: overdueRows.length, color: '#ef4444' },
    {
      label: 'Canceladas',
      value: invoiceRows.filter((item) => item.status === 'cancelled').length,
      color: '#aab4c7',
    },
  ].filter((item) => item.value > 0);

  const revenueSeries = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - (5 - index));
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    return {
      label: month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      value: invoiceRows
        .filter((item) => item.status === 'paid' && item.reference_month.startsWith(key))
        .reduce((sum, item) => sum + moneyNumber(item.amount), 0),
    };
  });

  const delinquencyMap = new Map<string, number>();
  for (const invoice of overdueRows) {
    const clinic = invoiceClinic(invoice);
    delinquencyMap.set(clinic, (delinquencyMap.get(clinic) || 0) + moneyNumber(invoice.amount));
  }
  const delinquency = Array.from(delinquencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const methodMap = new Map<string, number>();
  for (const payment of paymentRows.filter((item) => item.status === 'confirmed')) {
    const method = payment.payment_method || 'Não informado';
    methodMap.set(method, (methodMap.get(method) || 0) + moneyNumber(payment.amount));
  }
  const methodTotal = Array.from(methodMap.values()).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard Financeiro"
        subtitle="Visão geral da saúde financeira da plataforma."
        userName="Financeiro NexxoHub"
        notifications={overdueRows.length}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Receita Recorrente (MRR)"
          value={currency(mrr)}
          icon={BadgeDollarSign}
          tone="purple"
          trend="24%"
        />
        <MetricCard
          label="Receita Anual (ARR)"
          value={currency(arr)}
          icon={CircleDollarSign}
          tone="teal"
          trend="23%"
        />
        <MetricCard
          label="Ticket Médio"
          value={currency(averageTicket)}
          icon={ReceiptText}
          tone="orange"
          trend="9%"
        />
        <MetricCard
          label="Churn"
          value={`${churnRate.toFixed(1)}%`}
          icon={FileWarning}
          tone="red"
          trend="0,4 p.p."
          trendDirection="down"
        />
        <MetricCard
          label="Clínicas Ativas"
          value={activeSubscriptions.length}
          icon={Building2}
          tone="blue"
          trend="15%"
        />
        <MetricCard
          label="Inadimplência"
          value={currency(overdue)}
          icon={Landmark}
          tone="red"
          trend={overdueRows.length ? '15%' : '0%'}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <WorkspacePanel
          title="Receita nos Últimos 6 Meses"
          action={
            <span className="rounded-lg border px-3 py-1.5 text-[10px] text-slate-600">
              Últimos 6 meses⌄
            </span>
          }
        >
          <TrendChart data={revenueSeries} color="#6d43f5" height={235} />
        </WorkspacePanel>
        <WorkspacePanel title="Receita por Plano">
          {planData.length ? (
            <DonutChart
              data={planData}
              centerValue={currency(mrr)}
              centerLabel="Total"
              height={220}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhuma assinatura ativa." />
          )}
        </WorkspacePanel>
        <WorkspacePanel title="Situação das Faturas">
          {invoiceStatus.length ? (
            <DonutChart
              data={invoiceStatus}
              centerValue={invoiceRows.length}
              centerLabel="Total"
              height={220}
            />
          ) : (
            <EmptyWorkspaceState message="Nenhuma fatura cadastrada." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <WorkspacePanel
          title="Faturas em Aberto"
          footerLabel="Ver todas as faturas"
          footerHref="/finance/invoices"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-2 py-3">Clínica</th>
                  <th className="px-2 py-3">Vencimento</th>
                  <th className="px-2 py-3">Valor</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceRows
                  .filter((item) => ['pending', 'overdue'].includes(item.status))
                  .slice(0, 6)
                  .map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-2 py-3 font-medium">{invoiceClinic(invoice)}</td>
                      <td className="px-2 py-3">
                        {new Date(`${invoice.due_date}T12:00:00`).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-2 py-3">{currency(moneyNumber(invoice.amount))}</td>
                      <td className="px-2 py-3">
                        <StatusPill
                          label={
                            overdueRows.some((item) => item.id === invoice.id)
                              ? 'Atrasada'
                              : 'A vencer'
                          }
                          tone={
                            overdueRows.some((item) => item.id === invoice.id) ? 'red' : 'orange'
                          }
                        />
                      </td>
                      <td className="px-2 py-3 text-right">
                        <span className="rounded-lg border px-3 py-1.5 text-[10px] text-blue-700">
                          Ver fatura
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!invoiceRows.some((item) => ['pending', 'overdue'].includes(item.status)) && (
              <EmptyWorkspaceState message="Nenhuma fatura em aberto." />
            )}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Inadimplência por Clínica"
          footerLabel="Ver todas"
          footerHref="/finance/delinquency"
        >
          <div className="space-y-4 pt-1">
            {delinquency.map(([clinic, value]) => (
              <div key={clinic}>
                <div className="mb-2 flex justify-between text-xs">
                  <span>{clinic}</span>
                  <strong>{currency(value)}</strong>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${overdue ? Math.max(8, (value / overdue) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {!delinquency.length && <EmptyWorkspaceState message="Nenhuma clínica inadimplente." />}
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <WorkspacePanel title="Pagamentos Recebidos">
          <p className="text-2xl font-bold text-[#071737]">{currency(paid)}</p>
          <p className="mt-3 text-xs font-medium text-emerald-600">↑ Resultado consolidado</p>
        </WorkspacePanel>
        <WorkspacePanel title="Métodos de Pagamento">
          <div className="space-y-3">
            {Array.from(methodMap.entries()).map(([method, value]) => (
              <div key={method}>
                <div className="mb-1 flex justify-between text-[10px]">
                  <span>{method}</span>
                  <span>{methodTotal ? Math.round((value / methodTotal) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${methodTotal ? (value / methodTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
        <WorkspacePanel
          title="Fluxo de Caixa"
          footerLabel="Ver fluxo completo"
          footerHref="/finance/cash-flow"
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-emerald-600">Entradas</p>
              <strong className="mt-2 block">{currency(paid)}</strong>
            </div>
            <div>
              <p className="text-red-500">Em aberto</p>
              <strong className="mt-2 block">{currency(overdue)}</strong>
            </div>
            <div className="col-span-2 rounded-xl bg-violet-50 p-4">
              <p className="text-violet-700">Saldo do Período</p>
              <strong className="mt-2 block text-xl text-violet-700">
                {currency(paid - overdue)}
              </strong>
            </div>
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
