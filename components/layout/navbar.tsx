import { Button } from '../ui/button';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0">
              <span className="text-xl font-bold text-blue-600">NexxoHub</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard/profile" className="text-gray-700 hover:text-gray-900">
              Perfil
            </Link>
            <Button variant="outline" size="sm">
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
