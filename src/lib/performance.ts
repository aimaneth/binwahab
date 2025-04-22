'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

type ConnectionType = {
  effectiveType: string;
};

/**
 * Performance monitoring utility
 */
export const measureWebVitals = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Web Vitals reporting
      import('web-vitals').then((vitals) => {
        function sendToAnalytics(metric: Metric) {
          const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID || '';
          const body: Record<string, string> = {
            dsn: analyticsId,
            id: metric.id,
            page: window.location.pathname,
            href: window.location.href,
            event_name: metric.name,
            value: metric.value.toString(),
            speed: (
              'connection' in navigator &&
              navigator['connection'] &&
              'effectiveType' in (navigator['connection'] as ConnectionType)
            )
              ? (navigator['connection'] as ConnectionType).effectiveType
              : '',
          };

          const blob = new Blob([new URLSearchParams(body).toString()], {
            type: 'application/x-www-form-urlencoded',
          });
          if (navigator.sendBeacon) {
            navigator.sendBeacon(vitalsUrl, blob);
          } else
            fetch(vitalsUrl, {
              body: blob,
              method: 'POST',
              credentials: 'omit',
              keepalive: true,
            });
        }

        vitals.onCLS(sendToAnalytics);
        vitals.onFID(sendToAnalytics);
        vitals.onFCP(sendToAnalytics);
        vitals.onLCP(sendToAnalytics);
        vitals.onTTFB(sendToAnalytics);
      });
    }
  }, []);
};

/**
 * Image loading optimization
 */
export const imageLoadingConfig = {
  loading: 'lazy' as const,
  sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality: 75,
  minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Performance best practices
 */
export const performanceBestPractices = {
  // Implement React.lazy for code splitting
  lazyLoadComponents: true,
  
  // Enable caching for static assets
  enableCache: true,
  
  // Preload critical assets
  preloadAssets: ['fonts', 'critical-css'],
  
  // Optimize third-party scripts
  deferNonCriticalScripts: true,
};

/**
 * Cache configuration
 */
export const cacheConfig = {
  swr: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
  },
};

/**
 * Font optimization configuration
 */
export const fontOptimizationConfig = {
  subsets: ['latin'],
  display: 'swap',
  preload: true,
};

/**
 * Script loading optimization
 */
export const scriptLoadingConfig = {
  analytics: {
    strategy: 'lazyOnload' as const,
    defer: true,
  },
  ads: {
    strategy: 'lazyOnload' as const,
    defer: true,
  },
  criticalScripts: {
    strategy: 'beforeInteractive' as const,
  },
}; 