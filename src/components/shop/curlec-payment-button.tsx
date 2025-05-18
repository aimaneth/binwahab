import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createCurlecCheckoutOptions, initializeCurlecCheckout } from '@/lib/curlec/client';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

interface CurlecPaymentButtonProps {
  orderId?: string;
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  paymentMethod?: string;
}

export function CurlecPaymentButton({
  amount,
  currency = 'MYR',
  customerName,
  customerEmail,
  customerPhone,
  description = 'Purchase from BINWAHAB Shop',
  className,
  disabled = false,
  paymentMethod = 'CREDIT_CARD',
}: CurlecPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Check for environment variable
      if (!process.env.NEXT_PUBLIC_CURLEC_KEY_ID) {
        throw new Error('Curlec API key is not configured');
      }
      
      // Create Curlec order on the server
      const response = await fetch('/api/curlec/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `order_${Date.now()}`,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await response.json();
      
      // Configure Curlec checkout options
      const checkoutOptions = createCurlecCheckoutOptions({
        key: process.env.NEXT_PUBLIC_CURLEC_KEY_ID,
        orderId: orderData.id,
        amount,
        currency,
        name: 'BINWAHAB Shop',
        description,
        image: 'https://binwahab.com/images/logo.png',
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        callbackUrl: `${window.location.origin}/api/curlec/verify-payment?redirect=true`,
        theme: {
          color: '#6366F1'
        }
      });

      // Initialize Curlec checkout
      initializeCurlecCheckout(checkoutOptions);
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={className}
      size="lg"
    >
      {isLoading ? 'Processing...' : 'Pay with Curlec'}
    </Button>
  );
} 