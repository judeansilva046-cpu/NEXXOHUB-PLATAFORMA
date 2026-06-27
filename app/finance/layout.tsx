import Link from 'next/link';
import { BarChart3, BadgeDollarSign, Home, LogOut, Receipt } from 'lucide-react';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const navigation = [
    { label: 'Resumo Financeiro', href: '/finance', icon: BarChart3 },
    { label: 'NexxoHub Admin', href: '/nexxohub', icon: Home },
  ];

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <aside className="hidden w-72 flex-col bg-[#03152f] text-white lg:flex">
        <div className="border-b border-white/10 p-6">
          <Link href="/finance" className="flex items-center gap-3">
            <BadgeDollarSign className="h-9 w-9 text-cyan-400" />
            <span>
              <span className="block text-xl font-semibold">NexxoHub Finance</span>
              <span className="block text-xs text-slate-300">Portal Financeiro</span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-white/5"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-slate-300">
          Acesso restrito a <strong>nexxohub_admin</strong> e <strong>nexxohub_finance</strong>.
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Receipt className="h-4 w-4 text-blue-600" />
            Gestão financeira centralizada NexxoHub
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
