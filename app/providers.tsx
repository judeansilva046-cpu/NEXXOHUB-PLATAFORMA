'use client';

import { ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { ThemeProvider } from 'next-themes';

// Initialize Sentry
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </ThemeProvider>
  );
}
