"use client";

import React, { useEffect, useState, useRef } from "react";
import { Stripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { getStripe, appearance } from "@/lib/stripe/config";
import { useCart } from "@/hooks/use-cart";
import { OrderSummary } from "@/components/shop/order-summary";
import { OrderItem } from "@/types/order";
import { useSession } from "next-auth/react";
import type { StripeError, StripePaymentElementChangeEvent } from '@stripe/stripe-js';

// This is the inner form component that contains the actual payment form
interface PaymentFormProps {
  clientSecret: string;
}

function PaymentForm({ clientSecret }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!stripe) {
      console.log("[PaymentForm] Stripe not initialized");
      return;
    }
    if (!elements) {
      console.log("[PaymentForm] Elements not initialized");
      return;
    }
    console.log("[PaymentForm] Both Stripe and Elements are initialized");
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe not initialized");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log("Confirming payment...");
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout/success`,
          payment_method_data: {
            billing_details: {
              email: session?.user?.email || undefined,
            },
          },
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        console.error("Payment confirmation error:", confirmError);
        throw confirmError;
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('Payment successful!');
        router.push('/shop/checkout/success');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {session?.user?.email && (
        <div className="text-sm text-gray-600">
          Payment confirmation will be sent to: {session.user.email}
        </div>
      )}
      
      <div className="space-y-4">
        <h4 className="text-xl font-semibold">Payment Details</h4>
        <div className="min-h-[250px] bg-white rounded-lg p-4 shadow-sm relative">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="min-h-[200px]">
            <PaymentElement 
              id="payment-element"
              className="w-full"
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    email: session?.user?.email || undefined,
                  }
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto'
                },
                fields: {
                  billingDetails: {
                    email: 'never'
                  }
                }
              }}
              onReady={() => {
                console.log('[PaymentElement] Ready');
                setReady(true);
              }}
              onChange={(event: StripePaymentElementChangeEvent) => {
                console.log('[PaymentElement] Change:', event);
                if (event.complete) {
                  setError(null);
                } else if (event.empty) {
                  setError("Please enter your payment details");
                } else if (!event.complete) {
                  setError("Please check your payment details");
                }
              }}
            />
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || !ready || processing}
        className="w-full"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay now"
        )}
      </Button>
    </form>
  );
}

// This is the wrapper component that handles the payment intent creation
interface CheckoutFormProps {
  items: OrderItem[];
}

export function CheckoutForm({ items }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [error, setError] = useState<string>();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const hasCreatedPaymentIntent = useRef(false);

  // Initialize Stripe
  useEffect(() => {
    console.log("[CheckoutForm] Initializing Stripe...");
    setStripePromise(getStripe());
  }, []);

  useEffect(() => {
    if (hasCreatedPaymentIntent.current) {
      console.log("[CheckoutForm] Payment intent already created, skipping...");
      return;
    }

    async function createPaymentIntent() {
      try {
        hasCreatedPaymentIntent.current = true;
        console.log("[CheckoutForm] Creating payment intent with items:", items);
        
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            shippingState: "Selangor"
          })
        });

        const data = await response.json();
        console.log("[CheckoutForm] Payment intent response:", data);
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to create payment intent");
        }

        if (!data.clientSecret) {
          throw new Error("No client secret received from server");
        }

        console.log("[CheckoutForm] Setting client secret:", data.clientSecret);
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("[CheckoutForm] Payment intent creation failed:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize payment");
        hasCreatedPaymentIntent.current = false;
      }
    }

    createPaymentIntent();
  }, [items]);

  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Initializing payment system...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Preparing payment form...</span>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance,
    loader: 'auto' as const,
    fonts: [{
      cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
    }]
  };

  console.log("[CheckoutForm] Rendering Elements with options:", options);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <OrderSummary items={items} />
        <div className="mt-6 min-h-[400px]">
          <Elements stripe={stripePromise} options={options} key={clientSecret}>
            <PaymentForm clientSecret={clientSecret} />
          </Elements>
        </div>
      </Card>
    </div>
  );
}

export default CheckoutForm; 