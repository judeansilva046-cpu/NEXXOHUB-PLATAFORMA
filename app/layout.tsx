import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Analytics } from './analytics';

export const metadata: Metadata = {
  title: 'NexxoHub - Gestão Psicossocial Corporativa',
  description: 'Plataforma SaaS multi-tenant para gestão psicossocial corporativa baseada na NR-1',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
