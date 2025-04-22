'use client';

import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { measureWebVitals } from '@/lib/performance';
import Script from 'next/script';
import { scriptLoadingConfig } from '@/lib/performance';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

interface OptimizedLayoutProps {
  children: ReactNode;
}

export default function OptimizedLayout({ children }: OptimizedLayoutProps) {
  // Measure web vitals
  measureWebVitals();

  return (
    <>
      {/* Preload critical assets */}
      <link
        rel="preload"
        href="/fonts/inter.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* Apply performance-optimized font */}
      <style jsx global>{`
        :root {
          --font-sans: ${inter.style.fontFamily};
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
      <div className={inter.className}>
        {children}
      </div>
    </>
  );
} 