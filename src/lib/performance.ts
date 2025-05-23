'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

type ConnectionType = {
  effectiveType: string;
};

/**
 * Performance measurement utilities
 */
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Measure Core Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS(console.log);
    onFID(console.log);
    onFCP(console.log);
    onLCP(console.log);
    onTTFB(console.log);
  });
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
  if (typeof window === 'undefined') return;

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
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.src = src;
  script.async = async;
  script.defer = defer;
  document.head.appendChild(script);
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