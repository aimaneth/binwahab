import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { items, shippingAddress } = await req.json();
    
    if (!items?.length) {
      return new NextResponse('Cart is empty', { status: 400 });
    }

    // Calculate order total
    const subtotal = items.reduce((total: number, item: any) => {
      return total + (item.quantity * item.price);
    }, 0);

    const tax = subtotal * 0.06; // 6% tax
    const shipping = 10; // Fixed shipping rate for now
    const total = subtotal + tax + shipping;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(total, 'USD'),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 