import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const userId = metadata.userId;
  const orderItems = JSON.parse(metadata.orderItems);
  const shippingAddress = JSON.parse(metadata.shippingAddress);

  try {
    // First create the shipping address
    const address = await prisma.address.create({
      data: {
        userId,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone || "",
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        total: paymentIntent.amount / 100, // Convert from cents to dollars
        shippingAddressId: address.id,
        items: {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.unit_price, // Already in dollars
          })),
        },
      },
    });

    // Clear user's cart
    await prisma.cart.delete({
      where: {
        userId,
      },
    });

    return order;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.userId;

  // First create a dummy address for the failed order
  const address = await prisma.address.create({
    data: {
      userId,
      street: "Failed Payment",
      city: "Failed Payment",
      state: "Failed Payment",
      zipCode: "00000",
      country: "Failed Payment",
      phone: "0000000000",
    },
  });

  // Create order with failed status
  await prisma.order.create({
    data: {
      userId,
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      total: paymentIntent.amount / 100, // Convert from cents to dollars
      shippingAddressId: address.id,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
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