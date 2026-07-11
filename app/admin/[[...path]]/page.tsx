import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Database, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../../components/workspace/page-header';
import { WorkspacePanel } from '../../../components/workspace/panel';
import { requireNexxoHubRole } from '../../../lib/nexxohub-context';

type Section = {
  title: string;
  subtitle: string;
  table?: string;
  select?: string;
  order?: string;
  columns?: Array<[string, string]>;
  target?: string;
};

const sections: Record<string, Section> = {
  'access/users': { title: 'Usuários administrativos', subtitle: 'Contas internas com acesso ao NexxoHub.', table: 'portal_memberships', select: 'id,role,is_active,created_at,users(full_name,email)', order: 'created_at', columns: [['users','Usuário'],['role','Perfil'],['is_active','Ativo'],['created_at','Criado em']] },
  'access/roles': { title: 'Perfis e permissões', subtitle: 'Perfis RBAC persistidos para a organização.', table: 'roles', select: 'id,name,role_key,portal,description,created_at', order: 'created_at', columns: [['name','Perfil'],['role_key','Chave'],['portal','Portal'],['description','Descrição']] },
  'access/sessions': { title: 'Sessões e dispositivos', subtitle: 'Eventos reais de autenticação e segurança.', table: 'audit_logs', select: 'id,action,resource_type,ip_address,created_at', order: 'created_at', columns: [['action','Ação'],['resource_type','Recurso'],['ip_address','IP'],['created_at','Data']] },
  clinics: { title: 'Clínicas', subtitle: 'Clínicas cadastradas e seus estados atuais.', table: 'clinics', select: 'id,name,cnpj,status,created_at', order: 'created_at', columns: [['name','Clínica'],['cnpj','CNPJ'],['status','Status'],['created_at','Cadastro']] },
  'internal-users': { title: 'Usuários internos', subtitle: 'Equipe administrativa da plataforma.', target: '/admin/access/users' },
  plans: { title: 'Planos', subtitle: 'Planos comerciais reais disponíveis para assinatura.', table: 'billing_plans', select: 'id,name,code,monthly_price,is_active,created_at', order: 'created_at', columns: [['name','Plano'],['code','Código'],['monthly_price','Mensalidade'],['is_active','Ativo']] },
  contracts: { title: 'Contratos', subtitle: 'Contratos comerciais da plataforma.', target: '/dashboard/contracts' },
  subscriptions: { title: 'Assinaturas', subtitle: 'Assinaturas e ciclos de vigência.', table: 'subscriptions', select: 'id,status,starts_on,ends_on,created_at,billing_plans(name)', order: 'created_at', columns: [['billing_plans','Plano'],['status','Status'],['starts_on','Início'],['ends_on','Término']] },
  billing: { title: 'Cobranças e pagamentos', subtitle: 'Central financeira real.', target: '/finance' },
  blocks: { title: 'Bloqueios e suspensões', subtitle: 'Contratos suspensos com rastreabilidade.', table: 'contracts', select: 'id,contract_number,status,notes,updated_at', order: 'updated_at', columns: [['contract_number','Contrato'],['status','Status'],['notes','Motivo'],['updated_at','Atualização']] },
  modules: { title: 'Módulos e permissões', subtitle: 'Configurações funcionais persistidas.', table: 'settings', select: 'id,key,value,is_sensitive,updated_at', order: 'updated_at', columns: [['key','Configuração'],['value','Valor'],['is_sensitive','Sensível'],['updated_at','Atualização']] },
  integrations: { title: 'Integrações', subtitle: 'Conexões e provedores configurados.', table: 'integration_settings', select: 'id,provider,scope,is_enabled,updated_at', order: 'updated_at', columns: [['provider','Provedor'],['scope','Escopo'],['is_enabled','Ativa'],['updated_at','Atualização']] },
  automations: { title: 'Automações', subtitle: 'Execuções registradas pelas rotinas da plataforma.', table: 'integration_sync_logs', select: 'id,operation,status,attempt_count,error_message,created_at', order: 'created_at', columns: [['operation','Operação'],['status','Status'],['attempt_count','Tentativas'],['error_message','Erro']] },
  monitoring: { title: 'Monitoramento', subtitle: 'Alertas reais emitidos pelos serviços.', table: 'smart_alerts', select: 'id,title,severity,status,detected_at', order: 'detected_at', columns: [['title','Alerta'],['severity','Severidade'],['status','Status'],['detected_at','Detectado em']] },
  audit: { title: 'Auditoria', subtitle: 'Trilha imutável das ações administrativas.', table: 'audit_logs', select: 'id,action,resource_type,resource_id,created_at', order: 'created_at', columns: [['action','Ação'],['resource_type','Recurso'],['resource_id','Identificador'],['created_at','Data']] },
  security: { title: 'Segurança', subtitle: 'Eventos de acesso e alterações sensíveis.', table: 'audit_logs', select: 'id,action,ip_address,user_agent,created_at', order: 'created_at', columns: [['action','Evento'],['ip_address','IP'],['user_agent','Dispositivo'],['created_at','Data']] },
};

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') {
    const data = Array.isArray(value) ? value[0] : value;
    if (data && typeof data === 'object' && 'full_name' in data) return `${String(data.full_name || '')}${data.email ? ` · ${String(data.email)}` : ''}`;
    if (data && typeof data === 'object' && 'name' in data) return String(data.name);
    return JSON.stringify(value);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toLocaleString('pt-BR');
  return String(value);
}

export default async function AdminSection({ params }: { params: { path?: string[] } }) {
  const key = (params.path || []).join('/');
  const section = sections[key];
  if (!section) redirect('/admin');
  if (section.target) redirect(section.target);

  const { supabase } = await requireNexxoHubRole(['nexxohub_admin', 'nexxohub_finance', 'nexxohub_operator']);
  let rows: Record<string, unknown>[] = [];
  let errorMessage = '';
  if (section.table && section.select) {
    let query = supabase.from(section.table).select(section.select).limit(100);
    if (section.order) query = query.order(section.order, { ascending: false });
    if (key === 'access/users') query = query.eq('portal', 'nexxohub');
    if (key === 'blocks') query = query.eq('status', 'suspended');
    const result = await query;
    rows = (result.data || []) as unknown as Record<string, unknown>[];
    errorMessage = result.error?.message || '';
  }

  return <div className="space-y-4">
    <PageHeader title={section.title} subtitle={section.subtitle} userName="NexxoHub Admin" />
    <WorkspacePanel title={`${rows.length} registro${rows.length === 1 ? '' : 's'}`}>
      {errorMessage ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Não foi possível consultar: {errorMessage}</p> : rows.length === 0 ? <div className="py-14 text-center text-slate-500"><Database className="mx-auto mb-3 h-8 w-8"/><p className="text-sm font-medium">Nenhum registro cadastrado</p><p className="mt-1 text-xs">A tela está conectada ao banco e não exibe dados de demonstração.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-slate-500">{section.columns?.map(([,label]) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((row,index) => <tr key={String(row.id || index)} className="border-b border-slate-100">{section.columns?.map(([field]) => <td key={field} className="max-w-xs px-3 py-3 text-slate-700">{display(row[field])}</td>)}</tr>)}</tbody></table></div>}
    </WorkspacePanel>
    <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-medium text-cyan-700">Voltar ao dashboard <ExternalLink className="h-3.5 w-3.5"/></Link>
  </div>;
}
