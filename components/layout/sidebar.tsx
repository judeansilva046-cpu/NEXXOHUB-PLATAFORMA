import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="px-6 py-8">
        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/organizations"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Organizações
          </Link>
          <Link
            href="/dashboard/clinics"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Clínicas
          </Link>
          <Link
            href="/dashboard/companies"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Empresas
          </Link>
          <Link
            href="/dashboard/employees"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Colaboradores
          </Link>
          <Link
            href="/dashboard/assessments"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Avaliações
          </Link>
          <Link
            href="/dashboard/reports"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Relatórios
          </Link>
        </nav>
      </div>
    </aside>
  );
}
