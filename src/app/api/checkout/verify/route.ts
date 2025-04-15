import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payment_intent = searchParams.get("payment_intent");

    if (!payment_intent) {
      return NextResponse.json(
        { success: false, error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

    const success = paymentIntent.status === "succeeded";

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
} 