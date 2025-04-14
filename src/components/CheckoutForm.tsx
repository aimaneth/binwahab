'use client';

import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import type { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from './ui/button';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CartItem {
  id: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  email: string;
  phone?: string;
}

interface CheckoutFormProps {
  items: Array<{
    id: string;
    quantity: number;
  }>;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface PaymentIntentResponse {
  clientSecret: string;
  error?: StripeError;
}

interface PaymentIntentResult {
  paymentIntent?: PaymentIntent;
  error?: StripeError;
}

export function CheckoutFormWrapper({ items, shippingAddress }: CheckoutFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items, shippingAddress }),
        });

        const data = (await response.json()) as PaymentIntentResponse;

        if (data.error) {
          setError(data.error.message || 'An error occurred while creating the payment intent.');
          return;
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError('An error occurred while creating the payment intent.');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [items, shippingAddress]);

  return (
    <>
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm items={items} shippingAddress={shippingAddress} />
        </Elements>
      )}
    </>
  );
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ items, shippingAddress }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-confirmation`,
      },
    }) as PaymentIntentResult;

    if (result.error) {
      setError(result.error.message || 'An error occurred during payment confirmation.');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <PaymentElement />
      {error && <div className="text-red-500">{error}</div>}
      <Button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full mt-4"
      >
        {loading ? 'Processing...' : 'Pay now'}
      </Button>
    </form>
  );
}; 