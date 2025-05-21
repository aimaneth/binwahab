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
        
        // Try to redirect to a safe page after a short delay
        setTimeout(() => {
          try {
            router.push('/shop/confirmation?status=success&message=Your+payment+is+being+processed');
          } catch (e) {
            console.error('Failed to redirect:', e);
            // If redirect fails, try window.location as fallback
            window.location.href = '/shop/confirmation?status=success&message=Your+payment+is+being+processed';
          }
        }, 1500);
      }
    };

    // Add the event listener
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Clean up
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
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