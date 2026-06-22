import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexxoHub - Gestão Psicossocial Corporativa',
  description: 'Plataforma SaaS multi-tenant para gestão psicossocial corporativa baseada na NR-1',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
