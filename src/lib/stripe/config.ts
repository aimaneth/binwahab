import { loadStripe } from '@stripe/stripe-js';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error('⚠️ Stripe publishable key is missing. Make sure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in your environment.');
  throw new Error('Stripe publishable key is required');
}

console.log('🔑 Stripe environment check:', {
  hasPublishableKey: !!PUBLISHABLE_KEY,
  keyPrefix: PUBLISHABLE_KEY.startsWith('pk_test_') ? 'test' : 'live',
  environment: process.env.NODE_ENV
});

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(PUBLISHABLE_KEY);
    console.log('🔄 Initializing Stripe...');
  }
  return stripePromise;
};

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
    '.Label': {
      fontWeight: '500',
    },
    '.Tab': {
      padding: '10px 12px',
      border: '1px solid #E2E8F0',
    },
    '.Tab:hover': {
      border: '1px solid #0F172A',
    },
    '.Tab--selected': {
      border: '1px solid #0F172A',
      backgroundColor: '#0F172A',
      color: 'white',
    },
  },
};

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