'use client';

import { useEffect } from 'react';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    const trackWebVitals = (metric: Metric) => {
      // Send to analytics service (replace with your preferred service)
      console.log(`Performance metric: ${metric.name}`, {
        value: metric.value,
        rating: metric.rating,
      });
      
      // You can send this to Google Analytics, Vercel Analytics, etc.
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          custom_parameter_1: metric.rating,
        });
      }
    };

    // Import web-vitals library
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(trackWebVitals);
      onFID(trackWebVitals);
      onFCP(trackWebVitals);
      onLCP(trackWebVitals);
      onTTFB(trackWebVitals);
    });

    // Track custom performance metrics
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`Custom metric: ${entry.name}`, entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });

      return () => observer.disconnect();
    }
  }, []);

  return null; // This component doesn't render anything
}

// Helper function to mark performance measurements
export const markPerformance = {
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