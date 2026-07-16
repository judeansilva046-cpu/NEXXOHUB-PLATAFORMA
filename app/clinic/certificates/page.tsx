import Link from 'next/link';
import { Award, Building2, CalendarCheck, GraduationCap, Users, type LucideIcon } from 'lucide-react';
import { DonutChart, TrendChart, type DonutItem } from '../../../components/workspace/charts';
import { MetricCard } from '../../../components/workspace/metric-card';
import { PageHeader } from '../../../components/workspace/page-header';
import {
  EmptyWorkspaceState,
  StatusPill,
  WorkspacePanel,
} from '../../../components/workspace/panel';
import { requirePortalContext } from '../../../lib/portal-context';
import { firstRelation, type SupabaseRelation } from '../../../lib/supabase-relations';

type CertificateRow = {
  id: string;
  issued_at: string;
  certificate_url: string | null;
  metadata: Record<string, unknown> | null;
  companies: SupabaseRelation<{ name: string }>;
  employees: SupabaseRelation<{ full_name: string; email: string | null }>;
  programs: SupabaseRelation<{ title: string }>;
};

function monthKey(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export default async function ClinicCertificatesPage() {
  const { supabase, membership } = await requirePortalContext('clinic');
  if (!membership.clinic_id) throw new Error('Clinica nao encontrada.');

  const [{ data: certificates }, { count: activeCompanies }, { count: activeEmployees }] =
    await Promise.all([
      supabase
        .from('certificates')
        .select(
          'id, issued_at, certificate_url, metadata, companies(name), employees(full_name, email), programs(title)'
        )
        .eq('clinic_id', membership.clinic_id)
        .order('issued_at', { ascending: false }),
      supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', membership.clinic_id)
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', membership.clinic_id)
        .eq('status', 'active'),
    ]);

  const certificateRows = (certificates || []) as unknown as CertificateRow[];
  const uniqueEmployees = new Set(
    certificateRows
      .map((certificate) => firstRelation(certificate.employees)?.email)
      .filter(Boolean)
  );
  const companyNames = certificateRows
    .map((certificate) => firstRelation(certificate.companies)?.name)
    .filter((name): name is string => Boolean(name));
  const uniqueCompanies = new Set(companyNames);
  const completionRate =
    activeEmployees && activeEmployees > 0
      ? Math.min(100, Math.round((uniqueEmployees.size / activeEmployees) * 100))
      : 0;

  const companyData: DonutItem[] = Array.from(uniqueCompanies)
    .map((companyName, index) => ({
      label: companyName,
      value: certificateRows.filter(
        (certificate) => firstRelation(certificate.companies)?.name === companyName
      ).length,
      color: ['#2f76d2', '#12a36d', '#f5a308', '#8a5bd2', '#ef4444'][index % 5],
    }))
    .slice(0, 5);

  const series = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    month.setMonth(month.getMonth() - (5 - index));
    const key = month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    return {
      label: key,
      value: certificateRows.filter((certificate) => monthKey(certificate.issued_at) === key)
        .length,
    };
  });

  const quickActions: Array<[string, string, LucideIcon]> = [
    ['Programas', '/clinic/programs', GraduationCap],
    ['Aulas', '/clinic/classes', Award],
    ['Empresas', '/clinic/companies', Building2],
    ['Colaboradores', '/clinic/employees', Users],
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Certificados Emitidos"
        subtitle="Acompanhe certificados gerados pelos colaboradores das empresas atendidas."
        userName="Clinica"
        notifications={certificateRows.length}
      />

      <section className="rounded-2xl border border-violet-100 bg-violet-50/70 px-5 py-4 text-sm text-violet-950">
        A Clinica acompanha a emissao de certificados como evidencia operacional dos programas de
        aprendizagem, suporte ao dossie NR-1 e rastreabilidade de participacao por empresa.
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Certificados Emitidos"
          value={certificateRows.length}
          icon={Award}
          tone="purple"
        />
        <MetricCard
          label="Colaboradores Certificados"
          value={uniqueEmployees.size}
          icon={Users}
          tone="teal"
        />
        <MetricCard
          label="Empresas com Emissoes"
          value={uniqueCompanies.size}
          icon={Building2}
          tone="blue"
          hint={`${activeCompanies || 0} ativas`}
        />
        <MetricCard
          label="Cobertura Estimada"
          value={`${completionRate}%`}
          icon={CalendarCheck}
          tone="orange"
          hint="sobre colaboradores ativos"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <WorkspacePanel title="Historico de Certificados">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Colaborador</th>
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Programa</th>
                  <th className="px-3 py-3">Origem</th>
                  <th className="px-3 py-3">Emitido em</th>
                  <th className="px-3 py-3">Arquivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificateRows.map((certificate) => {
                  const employee = firstRelation(certificate.employees);
                  const company = firstRelation(certificate.companies);
                  const program = firstRelation(certificate.programs);
                  const source =
                    typeof certificate.metadata?.source === 'string'
                      ? certificate.metadata.source
                      : 'clinic_issue';

                  return (
                    <tr key={certificate.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#071737]">
                          {employee?.full_name || 'Colaborador'}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {employee?.email || 'Sem e-mail'}
                        </p>
                      </td>
                      <td className="px-3 py-3">{company?.name || '-'}</td>
                      <td className="px-3 py-3">{program?.title || '-'}</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          label={source === 'employee_self_issue' ? 'Autoemissao' : 'Clinica'}
                          tone={source === 'employee_self_issue' ? 'blue' : 'purple'}
                        />
                      </td>
                      <td className="px-3 py-3">
                        {new Date(certificate.issued_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-3">
                        {certificate.certificate_url ? (
                          <Link
                            href={certificate.certificate_url}
                            className="font-semibold text-blue-700 hover:text-blue-900"
                          >
                            Abrir
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!certificateRows.length && (
              <EmptyWorkspaceState message="Nenhum certificado emitido para esta clinica ainda." />
            )}
          </div>
        </WorkspacePanel>

        <div className="space-y-3">
          <WorkspacePanel title="Emissoes por Empresa">
            {companyData.length ? (
              <DonutChart
                data={companyData}
                centerValue={certificateRows.length}
                centerLabel="Certificados"
                height={220}
              />
            ) : (
              <EmptyWorkspaceState message="Sem certificados por empresa." />
            )}
          </WorkspacePanel>
          <WorkspacePanel title="Evolucao Mensal">
            <TrendChart data={series} color="#7c3aed" height={180} />
          </WorkspacePanel>
          <WorkspacePanel title="Acoes Relacionadas">
            <div className="space-y-2">
              {quickActions.map(([label, href, Icon]) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-blue-800 hover:bg-blue-50"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                  <span>&gt;</span>
                </Link>
              ))}
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
