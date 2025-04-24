import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      customer_email: session.customer_details?.email
    });
  } catch (error) {
    console.error("[SESSION_STATUS_ERROR]", {
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Failed to retrieve session status" },
      { status: 500 }
    );
  }
} 