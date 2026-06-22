/**
 * Performance monitoring utilities
 * Tracks Web Vitals and performance metrics
 */

export interface WebVitalMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Report Web Vitals
 * Can be integrated with analytics service
 */
export function reportWebVitals(metric: WebVitalMetrics) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', {
      name: metric.name,
      value: `${metric.value.toFixed(2)}ms`,
      rating: metric.rating,
    });
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Example: Send to analytics endpoint
    if (navigator.sendBeacon) {
      const body = JSON.stringify(metric);
      navigator.sendBeacon('/api/analytics/vitals', body);
    }
  }
}

/**
 * Measure component render time
 */
export function measureComponentRender(componentName: string) {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered in ${duration.toFixed(2)}ms`);
    }

    return duration;
  };
}

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`API: ${name} - ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.error(`API: ${name} failed after ${duration.toFixed(2)}ms`, error);
    }

    throw error;
  }
}

/**
 * Optimize large list rendering with virtualization
 */
export interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  buffer?: number;
}

export function getVisibleItems({
  itemHeight,
  containerHeight,
  items,
  buffer = 5,
}: VirtualizationOptions) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const visibleStart = Math.max(0, Math.floor(window.scrollY / itemHeight) - buffer);
  const visibleEnd = Math.min(items.length, visibleStart + visibleCount + buffer * 2);

  return {
    visibleStart,
    visibleEnd,
    visibleItems: items.slice(visibleStart, visibleEnd),
    offsetY: visibleStart * itemHeight,
  };
}

/**
 * Debounce function for search/filter optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && (performance as any).memory) {
    return {
      usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: ((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    };
  }
  return null;
}

/**
 * Measure time to interactive
 */
export function measureTimeToInteractive() {
  if (typeof window !== 'undefined') {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (nav) {
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        totalTime: nav.loadEventEnd - nav.fetchStart,
      };
    }
  }
  return null;
}
