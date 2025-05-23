import { useEffect } from 'react';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

/**
 * Performance utilities for client-side only
 * These functions should only be called in browser environment
 */

// Local type definitions to avoid importing web-vitals on server
interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Network information type
interface NetworkInformation {
  effectiveType: string;
}

// Browser environment check
const isBrowser = typeof window !== 'undefined';

/**
 * Performance measurement utilities
 */
export const measureWebVitals = () => {
  if (!isBrowser) return;

  // Measure Core Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS(console.log);
    onFID(console.log);
    onFCP(console.log);
    onLCP(console.log);
    onTTFB(console.log);
  }).catch(error => {
    console.error('Failed to load web-vitals:', error);
  });
};

/**
 * Custom performance measurement
 */
export const measureCustom = (name: string, fn: () => void | Promise<void>) => {
  if (!isBrowser || !window.performance) return fn();

  const startTime = performance.now();
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const endTime = performance.now();
      console.log(`${name} took ${endTime - startTime} milliseconds`);
    });
  } else {
    const endTime = performance.now();
    console.log(`${name} took ${endTime - startTime} milliseconds`);
    return result;
  }
};

/**
 * Mark performance points
 */
export const markPerformance = (name: string) => {
  if (!isBrowser || !window.performance?.mark) return;
  performance.mark(name);
};

/**
 * Measure between performance marks
 */
export const measureBetween = (name: string, startMark: string, endMark: string) => {
  if (!isBrowser || !window.performance?.measure) return;
  try {
    performance.measure(name, startMark, endMark);
  } catch (error) {
    console.warn(`Failed to measure ${name}:`, error);
  }
};

/**
 * Image loading configuration
 */
export const imageLoadingConfig = {
  loading: 'lazy' as const,
  placeholder: 'blur' as const,
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
};

/**
 * Performance markers
 */
export const performanceMarkers = {
  start: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
    }
  },
  end: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  },
};

/**
 * Preload critical resources
 */
export const preloadCriticalResources = () => {
  if (!isBrowser) return;

  // Preload critical images
  const criticalImages = [
    '/images/hero-banner.jpg',
    '/images/logo.png',
  ];

  criticalImages.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

/**
 * Optimize third-party scripts
 */
export const loadThirdPartyScript = (src: string, async = true, defer = true) => {
  if (!isBrowser) return Promise.reject(new Error('Browser environment required'));

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
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

/**
 * Get performance metrics safely
 */
export const getPerformanceMetrics = () => {
  if (!isBrowser || !window.performance) return null;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return null;
  
  return {
    ttfb: navigation.responseStart - navigation.requestStart,
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
    lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
    cls: 0, // Would need to be calculated separately
  };
}; 