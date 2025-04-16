import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from 'stripe';
import { prisma } from "@/lib/prisma";
import { OrderItem } from "@/types/order";
import { calculateOrderAmount } from '@/lib/stripe/calculate-amount';

// Define the expected item structure
interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  images?: string[];
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ Server-side Stripe secret key is missing. Make sure STRIPE_SECRET_KEY is set in your environment.');
  throw new Error('Stripe secret key is required');
}

console.log('🔑 Server-side Stripe environment check:', {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  keyPrefix: process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'test' : 'live',
  environment: process.env.NODE_ENV
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received checkout request:', body);

    const { items } = body as { items: CheckoutItem[] };

    if (!items?.length) {
      console.log('No items provided in request');
      return NextResponse.json(
        { error: 'Please provide items to purchase' },
        { status: 400 }
      );
    }

    // Calculate subtotal and tax
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06; // 6% Malaysian GST
    
    // Create line items with base prices
    const lineItems = items.map((item: CheckoutItem) => ({
      price_data: {
        currency: 'myr',
        product_data: {
          name: item.name || 'Unknown Product',
          description: item.description || '',
          images: item.images?.length ? [item.images[0]] : [],
        },
        unit_amount: Math.round(item.price * 100), // Base price in cents
      },
      quantity: item.quantity || 1,
    }));

    // Add shipping as a line item
    lineItems.push({
      price_data: {
        currency: 'myr',
        product_data: {
          name: 'Standard Shipping',
          description: 'Delivery within 3-5 business days',
          images: [],
        },
        unit_amount: 1000, // RM10.00 in cents
      },
      quantity: 1,
    });

    // Add tax as a line item
    lineItems.push({
      price_data: {
        currency: 'myr',
        product_data: {
          name: 'GST (6%)',
          description: 'Malaysian Goods and Services Tax',
          images: [],
        },
        unit_amount: Math.round(tax * 100), // Tax amount in cents
      },
      quantity: 1,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'fpx'],
      locale: 'en',
      line_items: lineItems,
      mode: 'payment',
      success_url: `https://binwahab.vercel.app/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://binwahab.vercel.app/shop/cart`,
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      url: session.url
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (err) {
    console.error('Error creating checkout session:', {
      error: err,
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 