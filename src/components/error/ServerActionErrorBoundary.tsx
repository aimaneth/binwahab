'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Custom error boundary component for handling server action errors
 * This helps mitigate the "Missing 'next-action' header" error
 */
export function ServerActionErrorBoundary({ 
  children, 
  fallback = <div>Something went wrong. Redirecting...</div> 
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason);
      
      // Check if this is the server action error we're looking for
      if (
        event.reason?.message?.includes("Failed to find Server Action") ||
        event.reason?.message?.includes("Missing 'next-action' header") ||
        event.reason?.toString().includes("Missing 'next-action' header")
      ) {
        console.log('Caught Server Action error, handling gracefully');
        event.preventDefault(); // Prevent the error from crashing the app
        setHasError(true);
        
        // Try to redirect to safe API endpoint after a short delay
        setTimeout(() => {
          try {
            // Extract any payment-related query parameters from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const hasPaymentParams = 
              urlParams.has('razorpay_payment_id') || 
              urlParams.has('razorpay_order_id') || 
              urlParams.has('payment_id') ||
              urlParams.has('order_id') ||
              urlParams.has('session_id');
            
            // If we have payment params, use them in redirect
            if (hasPaymentParams) {
              // Use our API redirect helper 
              window.location.href = `/api/payment-redirect?${urlParams.toString()}`;
            } else {
              // Otherwise just do a simpler redirect
              router.push('/shop/confirmation?status=success&message=Your+payment+is+being+processed');
            }
          } catch (e) {
            console.error('Failed to redirect:', e);
            // If redirect fails, try window.location as fallback
            window.location.href = '/api/payment-redirect?status=success&message=Your+payment+is+being+processed';
          }
        }, 1000);
      }
    };

    // Also listen for regular errors (not just promise rejections)
    const handleError = (event: ErrorEvent) => {
      console.error('Error event:', event.error);
      
      // Check if error message matches our target error
      if (
        event.error?.message?.includes("Failed to find Server Action") ||
        event.error?.message?.includes("Missing 'next-action' header") ||
        event.error?.toString().includes("next-action") ||
        event.message?.includes("next-action")
      ) {
        console.log('Caught regular error event for Server Action error');
        event.preventDefault(); // Prevent the error from crashing the app
        setHasError(true);
        
        // Redirect to safety
        setTimeout(() => {
          try {
            window.location.href = '/api/payment-redirect?status=success&message=Your+payment+is+being+processed';
          } catch (e) {
            console.error('Redirect failed:', e);
          }
        }, 1000);
      }
    };

    // Add the event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Clean up
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [router]);

  // If we caught an error, show the fallback UI
  if (hasError) {
    return <>{fallback}</>;
  }

  // Otherwise, render children normally
  return <>{children}</>;
}

export default ServerActionErrorBoundary; 