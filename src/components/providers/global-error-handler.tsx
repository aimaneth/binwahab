'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function GlobalErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Check if this is the server action error we're looking for
      if (
        event.reason?.message?.includes("Failed to find Server Action") ||
        event.reason?.message?.includes("Missing 'next-action' header") ||
        event.reason?.toString().includes("Missing 'next-action' header")
      ) {
        console.log('Caught Server Action error in global handler');
        event.preventDefault(); // Prevent the error from crashing the app
        
        // Check if we're in a payment flow based on the URL
        const isPaymentPath = 
          window.location.pathname.includes('/shop/checkout') || 
          window.location.pathname.includes('/shop/confirmation') || 
          window.location.pathname.includes('/payment');
        
        // If we're in a payment flow, redirect to confirmation
        if (isPaymentPath) {
          try {
            console.log('Redirecting to confirmation page');
            router.push('/shop/confirmation?status=success&message=Your+payment+is+being+processed');
          } catch (e) {
            console.error('Failed to redirect with router:', e);
            // Fallback to direct location change
            window.location.href = '/shop/confirmation?status=success&message=Your+payment+is+being+processed';
          }
        }
      }
    };

    // Add global error event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  // This component doesn't render anything visually
  return null;
}

export default GlobalErrorHandler; 