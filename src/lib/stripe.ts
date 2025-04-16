import Stripe from 'stripe';

// Validate environment variables
const validateEnv = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined');
  }

  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
  }

  // Validate key format
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid STRIPE_SECRET_KEY format');
  }
  if (!publishableKey.startsWith('pk_')) {
    throw new Error('Invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format');
  }

  return {
    secretKey,
    publishableKey,
  };
};

// Validate on initialization
const env = validateEnv();

const stripeConfig = {
  apiVersion: '2025-03-31.basil' as const,
  typescript: true,
  appInfo: {
    name: 'BinWahab',
    version: '0.1.0',
  },
} satisfies Stripe.StripeConfig;

export const stripe = new Stripe(env.secretKey, stripeConfig);

export const getStripeInstance = () => {
  const env = validateEnv();
  return new Stripe(env.secretKey, stripeConfig);
};

export const formatAmountForStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}; 