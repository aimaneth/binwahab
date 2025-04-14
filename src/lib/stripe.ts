import Stripe from 'stripe';

// Validate environment variables
const validateEnv = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined');
  }
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
  }
};

// Validate on initialization
validateEnv();

const stripeConfig = {
  apiVersion: '2025-03-31.basil' as const,
  typescript: true as const,
  appInfo: {
    name: 'BINWAHAB Shop',
    version: '1.0.0',
  },
};

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, stripeConfig);

export const getStripeInstance = () => {
  validateEnv();
  return new Stripe(process.env.STRIPE_SECRET_KEY!, stripeConfig);
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