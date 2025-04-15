import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe, constructWebhookEvent } from "@/lib/stripe/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const userId = metadata.userId;
  const orderItems = JSON.parse(metadata.orderItems);
  const shippingAddressId = metadata.shippingAddressId;

  try {
    // Create order using the existing shipping address
    const order = await prisma.order.create({
      data: {
        userId,
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        total: paymentIntent.amount / 100, // Convert from cents to dollars
        shippingAddressId,
        items: {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.unit_price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Clear user's cart after successful order
    await prisma.cart.delete({
      where: {
        userId,
      },
    }).catch((error) => {
      // Log but don't fail if cart deletion fails
      console.error("Failed to clear cart:", error);
    });

    return order;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.userId;
  const shippingAddressId = paymentIntent.metadata.shippingAddressId;

  try {
    // Create order with failed status
    await prisma.order.create({
      data: {
        userId,
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        total: paymentIntent.amount / 100,
        shippingAddressId,
      },
    });
  } catch (error) {
    console.error("Error creating failed order:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = await constructWebhookEvent(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(failedPaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 