'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Browser environment check
const isBrowser = typeof window !== 'undefined';

// Generic loading components
const ChartSkeleton = () => (
  <div className="animate-pulse bg-gray-200 h-64 rounded" />
);

const AdminSkeleton = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const FormSkeleton = () => (
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-10 rounded" />
    <div className="animate-pulse bg-gray-200 h-10 rounded" />
    <div className="animate-pulse bg-gray-200 h-12 rounded" />
  </div>
);

// Utility function for creating dynamic components with proper SSR handling
export function createDynamicComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: {
    loading?: () => JSX.Element | null;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || (() => <div className="animate-pulse bg-gray-200 h-32 rounded" />),
    ssr: options?.ssr ?? false, // Default to false for better performance and fewer SSR issues
  });
}

// Example usage patterns for different types of components
export const DynamicPatterns = {
  // Heavy visualizations (charts, maps, etc.) - Always client-side only
  createChart: (importPath: string) => 
    createDynamicComponent(() => import(importPath), {
      loading: ChartSkeleton,
      ssr: false // Charts should never be SSR'd
    }),

  // Admin-only features - Client-side only for security
  createAdminComponent: (importPath: string) => 
    createDynamicComponent(() => import(importPath), {
      loading: AdminSkeleton,
      ssr: false // Admin components should be client-side only
    }),

  // Payment forms and sensitive components - Client-side only
  createPaymentForm: (importPath: string) => 
    createDynamicComponent(() => import(importPath), {
      loading: FormSkeleton,
      ssr: false // Payment forms need browser APIs
    }),

  // Modals and overlays - Client-side only
  createModal: (importPath: string) => 
    createDynamicComponent(() => import(importPath), {
      loading: () => null,
      ssr: false // Modals need browser APIs
    }),

  // Product galleries and media-heavy components
  createMediaComponent: (importPath: string) => 
    createDynamicComponent(() => import(importPath), {
      loading: () => (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 aspect-square rounded" />
          ))}
        </div>
      ),
      ssr: false // Media components often use browser APIs
    }),

  // Interactive components that need browser APIs
  createInteractiveComponent: (importPath: string) => 
    createDynamicComponent(() => import(importPath), {
      loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded" />,
      ssr: false // Interactive components need browser APIs
    }),

  // Safe SSR components (rare cases where SSR is beneficial and safe)
  createSSRSafeComponent: (importPath: string) => 
    createDynamicComponent(() => import(importPath), {
      loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded" />,
      ssr: true // Only use when component is truly SSR-safe
    }),
};

// Helper to check if we should render client-only components
export const shouldRenderClientComponent = () => isBrowser;

// Usage examples (commented out to avoid import errors)
/*
// Example usage in your components:

// For a heavy chart component
const LazyChart = DynamicPatterns.createChart('@/components/charts/analytics-chart');

// For admin dashboard
const LazyAdminPanel = DynamicPatterns.createAdminComponent('@/components/admin/panel');

// For payment forms
const LazyCheckout = DynamicPatterns.createPaymentForm('@/components/checkout/payment-form');

// For modals
const LazyContactModal = DynamicPatterns.createModal('@/components/modals/contact-modal');

// For product galleries
const LazyProductGallery = DynamicPatterns.createMediaComponent('@/components/shop/product-gallery');

// For interactive components
const LazyInteractive = DynamicPatterns.createInteractiveComponent('@/components/interactive/widget');

// Direct dynamic import with proper SSR handling
const LazyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <div>Loading...</div>,
  ssr: false // Safer default
});

// Conditional rendering for client-only components
function MyComponent() {
  return (
    <div>
      {shouldRenderClientComponent() && <LazyInteractive />}
    </div>
  );
}
*/ 