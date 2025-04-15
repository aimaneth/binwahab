import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  throw new Error('Invalid STRIPE_SECRET_KEY format');
}

// Stripe configuration
const stripeConfig = {
  apiVersion: '2025-03-31.basil' as Stripe.StripeConfig['apiVersion'],
  typescript: true,
  appInfo: {
    name: 'BINWAHAB Shop',
    version: '1.0.0',
  },
} as const;

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, stripeConfig);

// Helper functions
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

// Customer management
export async function getOrCreateCustomer(userId: string, email: string, name?: string) {
  try {
    // Check if customer exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId }
    });

    // Save customer ID to database
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer.id;
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw new Error('Failed to process customer information');
  }
}

// Payment intent creation
export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId: string,
  metadata: Record<string, string>
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount, currency),
      currency,
      customer: customerId,
      metadata,
      payment_method_types: ['card', 'fpx'],
      setup_future_usage: currency === 'myr' ? undefined : 'off_session', // FPX doesn't support off_session
    });
    console.log('Payment intent created:', paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw new Error('Failed to create payment intent');
  }
}

// Webhook handling
export async function constructWebhookEvent(payload: string, signature: string) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    throw new Error('Invalid webhook signature');
  }
} 