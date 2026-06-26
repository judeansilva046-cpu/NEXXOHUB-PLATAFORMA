'use client';

import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!measurementId || typeof window === 'undefined') return;

    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
      window.gtag('js', new Date());
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }

    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX', {
        page_path: pathname,
        page_title: document.title,
        allow_google_signals: false,
      });
    }
  }, [pathname]);

  return null;
}

export function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return <Suspense fallback={null}>{measurementId ? <AnalyticsTracker /> : null}</Suspense>;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
