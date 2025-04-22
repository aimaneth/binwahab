'use client';

import Script from 'next/script';
import { scriptLoadingConfig } from '@/lib/performance';

export function GoogleAnalytics() {
  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy={scriptLoadingConfig.analytics.strategy}
      defer={scriptLoadingConfig.analytics.defer}
    />
  );
} 