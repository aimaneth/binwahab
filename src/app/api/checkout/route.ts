import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { OrderItem } from "@/types/order";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[CHECKOUT_REQUEST]", { body });
    
    const { items, shippingState } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    if (!shippingState) {
      return NextResponse.json({ error: "Shipping state is required" }, { status: 400 });
    }

    // Calculate subtotal
    const subtotal = items.reduce((total: number, item: OrderItem) => {
      const itemPrice = parseFloat(item.variant?.price || item.product.price);
      return total + (itemPrice * item.quantity);
    }, 0);

    console.log("[CHECKOUT_SUBTOTAL]", { subtotal });

    // Convert to cents for Stripe
    const amount = Math.round(subtotal * 100);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "myr",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id,
        shippingState,
        items: JSON.stringify(items.map(item => ({
          id: item.product.id,
          quantity: item.quantity,
          variantId: item.variant?.id,
        }))),
      },
    });

    console.log("[PAYMENT_INTENT_CREATED]", { 
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount
    });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", {
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
} 