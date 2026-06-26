import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { portalConfig, type PortalType } from '../../lib/portal';

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const params = await searchParams;
  const portal = (params.portal || 'nexxohub') as PortalType;
  const config = portalConfig[portal] || portalConfig.nexxohub;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldX className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-950">Acesso não autorizado</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sua conta não possui uma membership ativa para o {config.label}.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
