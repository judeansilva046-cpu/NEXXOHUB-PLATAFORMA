import { CheckCircle2, Database, ShieldCheck } from 'lucide-react';
import { PageHeader } from './page-header';
import { WorkspacePanel } from './panel';

export function WorkspaceSectionPage({
  title,
  subtitle,
  portalLabel,
}: {
  title: string;
  subtitle: string;
  portalLabel: string;
}) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={subtitle} userName={portalLabel} />
      <section className="grid gap-3 md:grid-cols-3">
        <WorkspacePanel title="Status do Módulo">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="text-sm font-semibold">Disponível</p>
              <p className="mt-1 text-xs">Rota protegida e integrada ao portal.</p>
            </div>
          </div>
        </WorkspacePanel>
        <WorkspacePanel title="Segurança">
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-blue-700">
            <ShieldCheck className="h-6 w-6" />
            <div>
              <p className="text-sm font-semibold">Acesso controlado</p>
              <p className="mt-1 text-xs">Permissões aplicadas por tenant e perfil.</p>
            </div>
          </div>
        </WorkspacePanel>
        <WorkspacePanel title="Fonte de Dados">
          <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-4 text-violet-700">
            <Database className="h-6 w-6" />
            <div>
              <p className="text-sm font-semibold">Supabase</p>
              <p className="mt-1 text-xs">Dados persistidos e auditáveis.</p>
            </div>
          </div>
        </WorkspacePanel>
      </section>
      <WorkspacePanel title="Visão Geral">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
          <p className="text-sm font-medium text-[#071737]">{title}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Esta área já utiliza o novo padrão visual da NexxoHub e está preparada para receber os
            registros operacionais específicos deste módulo.
          </p>
        </div>
      </WorkspacePanel>
    </div>
  );
}
