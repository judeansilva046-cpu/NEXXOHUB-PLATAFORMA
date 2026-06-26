export type PortalType = 'nexxohub' | 'clinic' | 'company' | 'employee';

export const portalConfig: Record<PortalType, { label: string; home: string; subdomain: string }> =
  {
    nexxohub: { label: 'Portal NexxoHub', home: '/dashboard', subdomain: 'admin' },
    clinic: { label: 'Portal Clínica', home: '/clinic', subdomain: 'clinica' },
    company: { label: 'Portal Empresa', home: '/company', subdomain: 'empresa' },
    employee: { label: 'Portal Colaborador', home: '/employee', subdomain: 'funcionario' },
  };

export function portalFromRequest(hostname: string, pathname: string): PortalType {
  const host = hostname.split(':')[0].toLowerCase();

  if (host.startsWith('clinica.')) return 'clinic';
  if (host.startsWith('empresa.')) return 'company';
  if (host.startsWith('funcionario.')) return 'employee';
  if (host.startsWith('admin.')) return 'nexxohub';

  // Path fallback keeps all portals testable on localhost and Netlify staging.
  if (pathname === '/clinic' || pathname.startsWith('/clinic/')) return 'clinic';
  if (pathname === '/company' || pathname.startsWith('/company/')) return 'company';
  if (pathname === '/employee' || pathname.startsWith('/employee/')) return 'employee';
  return 'nexxohub';
}

export function isProtectedPortalPath(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/clinic' ||
    pathname.startsWith('/clinic/') ||
    pathname === '/company' ||
    pathname.startsWith('/company/') ||
    pathname === '/employee' ||
    pathname.startsWith('/employee/')
  );
}
