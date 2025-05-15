'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { CurlecCheckout } from '@/components/shop/CurlecCheckout';

export default function CurlecCheckoutPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(`[CurlecCheckoutPage] ${message}`);
    setDebug(prev => [...prev, message]);
  };

  useEffect(() => {
    // Wait for session to load
    if (sessionStatus === 'loading') return;

    // Make sure we have all required parameters
    if (!orderId || !amount) {
      setError('Missing required parameters for checkout. Please return to cart and try again.');
      setLoading(false);
      return;
    }

    if (!session?.user) {
      setError('Please log in to proceed with checkout');
      setLoading(false);
      return;
    }

    addDebug(`Order ID: ${orderId}, Amount: ${amount}`);
    
    // Attempt to render checkout component directly instead of using initializeCurlecCheckout
    setLoading(false);
  }, [orderId, amount, session, sessionStatus]);

  // If we're still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Initializing payment...</p>
      </div>
    );
  }

  // If there was an error, show error message with retry button
  if (error) {
    return (
      <Card className="max-w-md mx-auto my-12">
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-destructive">{error}</p>
          {debug.length > 0 && (
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded">
              <details>
                <summary className="cursor-pointer">Debug Information</summary>
                <pre className="text-xs mt-2 overflow-auto">
                  {debug.join('\n')}
                </pre>
              </details>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>Back to Checkout</Button>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render the CurlecCheckout component directly
  return (
    <div className="max-w-md mx-auto my-12">
      <CurlecCheckout 
        orderId={orderId!} 
        amount={parseFloat(amount!)}
        onPaymentComplete={(paymentId) => {
          addDebug(`Payment completed: ${paymentId}`);
          window.location.href = `/shop/checkout/success?payment_id=${paymentId}&order_id=${orderId}`;
        }}
        onPaymentFailure={(error) => {
          addDebug(`Payment failed: ${error}`);
          setError(`Payment failed: ${error}`);
        }}
      />
      
      {debug.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <details>
              <summary className="cursor-pointer">Debug Information</summary>
              <pre className="text-xs mt-2 overflow-auto">
                {debug.join('\n')}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 