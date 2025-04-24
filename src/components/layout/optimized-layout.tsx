'use client';

import { ReactNode } from 'react';
import { measureWebVitals } from '@/lib/performance';
import Script from 'next/script';
import { scriptLoadingConfig } from '@/lib/performance';
import { fontSans } from '@/lib/fonts';

interface OptimizedLayoutProps {
  children: ReactNode;
}

export default function OptimizedLayout({ children }: OptimizedLayoutProps) {
  // Measure web vitals
  measureWebVitals();

  return (
    <>
      {/* Apply performance-optimized font */}
      <style jsx global>{`
        :root {
          --font-sans: ${fontSans.style.fontFamily};
        }
      `}</style>

      {/* Defer non-critical scripts */}
      <Script
        src="https://www.googletagmanager.com/gtag/js"
        strategy={scriptLoadingConfig.analytics.strategy}
        defer={scriptLoadingConfig.analytics.defer}
      />

      {/* Critical scripts */}
      <Script
        src="/scripts/critical.js"
        strategy={scriptLoadingConfig.criticalScripts.strategy}
      />

      {/* Main content */}
      <div className={fontSans.className}>
        {children}
      </div>
    </>
  );
} 