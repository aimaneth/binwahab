import { loadStripe, Stripe as StripeType } from '@stripe/stripe-js';

// Environment validation
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
}

// Stripe appearance configuration
export const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0F172A',
    colorBackground: '#ffffff',
    colorText: '#0F172A',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '6px',
    borderRadius: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      padding: '8px 12px',
    },
    '.Input:focus': {
      border: '1px solid #0F172A',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 0 0 4px rgb(15 23 42 / 0.1)',
    },
  },
};

// Initialize Stripe
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
  locale: 'en',
});

// Types
export interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  returnUrl: string;
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export interface PaymentIntentResponse {
  clientSecret: string;
  publishableKey: string;
}

export interface CreatePaymentIntentData {
  items: CartItem[];
  shippingAddress: Address;
}

export interface CartItem {
  product: {
    id: string | number;
    name: string;
    price: number;
  };
  variant?: {
    sku: string;
    price: number;
  };
  quantity: number;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
} 