"use client";

import React, { useEffect, useState } from "react";
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
import { stripePromise, appearance } from "@/lib/stripe/config";

function CheckoutFormContent() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          router.push(`/checkout/success?payment_intent=${paymentIntent.id}`);
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Please provide your payment information.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || "An error occurred.");
        setIsLoading(false);
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: email,
        },
      });

      if (result.error) {
        if (result.error.type === "card_error" || result.error.type === "validation_error") {
          setMessage(result.error.message || "An error occurred during payment.");
        } else {
          setMessage("An unexpected error occurred.");
        }
        router.push('/checkout/cancel');
      }
    } catch (e) {
      setMessage("An unexpected error occurred.");
      console.error("Payment error:", e);
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </label>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Payment Details</h4>
            <PaymentElement id="payment-element" />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !stripe || !elements}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay now"
            )}
          </Button>

          {message && (
            <Alert variant={message.includes("succeeded") ? "default" : "destructive"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </form>
      </Card>
    </div>
  );
}

export function CheckoutForm() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Get the client secret from the URL
    const secret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    if (secret) {
      setClientSecret(secret);
    }
  }, []);

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading payment details...</span>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        clientSecret,
        appearance,
        loader: 'auto',
      }}
    >
      <CheckoutFormContent />
    </Elements>
  );
}

export default CheckoutForm; 