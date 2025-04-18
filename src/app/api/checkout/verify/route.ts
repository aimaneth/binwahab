import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const session = await getServerSession(authOptions);

    if (!sessionId) {
      console.error("Missing session_id in request");
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!session?.user?.id) {
      console.error("No authenticated user found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Retrieve the Checkout Session
    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError: any) {
      console.error("Stripe session retrieval error:", stripeError.message);
      return NextResponse.json(
        { error: "Failed to retrieve checkout session from Stripe" },
        { status: 400 }
      );
    }
    
    if (!checkoutSession) {
      console.error("No checkout session found for ID:", sessionId);
      return NextResponse.json(
        { error: "Checkout session not found" },
        { status: 404 }
      );
    }

    // Check payment status first
    if (checkoutSession.payment_status !== "paid") {
      console.error("Payment not completed. Status:", checkoutSession.payment_status);
      return NextResponse.json({
        success: false,
        status: "unpaid",
        message: "Payment has not been completed"
      });
    }

    // Get the payment intent ID from the session
    const paymentIntentId = checkoutSession.payment_intent as string;

    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          { stripeSessionId: sessionId },
          { stripePaymentIntentId: paymentIntentId }
        ]
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          }
        },
        shippingAddress: true
      }
    });

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        status: "paid",
        orderId: existingOrder.id,
        total: existingOrder.total,
        items: existingOrder.items.map(item => ({
          name: item.variant?.name || item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: Number(item.price)
        })),
        shippingAddress: existingOrder.shippingAddress,
        message: "Order already processed"
      });
    }

    // Get shipping address from session metadata
    const metadata = checkoutSession.metadata;
    if (!metadata?.shippingAddressId) {
      console.error("Missing shippingAddressId in session metadata");
      return NextResponse.json(
        { error: "Missing shipping address in session" },
        { status: 400 }
      );
    }

    // Verify the shipping address exists and belongs to the user
    const address = await prisma.address.findUnique({
      where: {
        id: metadata.shippingAddressId,
        userId: session.user.id
      }
    });

    if (!address) {
      console.error("Invalid shipping address. ID:", metadata.shippingAddressId, "User:", session.user.id);
      return NextResponse.json(
        { error: "Invalid shipping address" },
        { status: 400 }
      );
    }

    // Parse items from metadata
    let orderItems: any[] = [];
    try {
      orderItems = metadata.items ? JSON.parse(metadata.items) : [];
      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error("Invalid or empty order items array");
      }
    } catch (error) {
      console.error("Error parsing order items from metadata:", error, "Raw items:", metadata.items);
      return NextResponse.json(
        { error: "Invalid order items data" },
        { status: 400 }
      );
    }

    // Create order with items and shipping address
    let order;
    try {
      order = await prisma.order.create({
        data: {
          userId: session.user.id,
          total: checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0,
          status: "PROCESSING",
          paymentMethod: "CREDIT_CARD",
          paymentStatus: "PAID",
          stripePaymentIntentId: paymentIntentId,
          stripeSessionId: sessionId,
          amountSubtotal: checkoutSession.amount_subtotal,
          amountTotal: checkoutSession.amount_total,
          currency: checkoutSession.currency || "myr",
          shippingAddressId: metadata.shippingAddressId,
          items: {
            createMany: {
              data: orderItems.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price
              }))
            }
          }
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          },
          shippingAddress: true
        }
      });
    } catch (prismaError: any) {
      console.error("Error creating order:", prismaError.message, "Order data:", {
        userId: session.user.id,
        sessionId,
        items: orderItems
      });
      return NextResponse.json(
        { error: "Failed to create order in database" },
        { status: 500 }
      );
    }

    // Update stock levels using the already parsed orderItems
    try {
      await Promise.all(orderItems.map(async (item: any) => {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          });
        } else if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }));
    } catch (stockError: any) {
      console.error("Error updating stock levels:", stockError.message, "Items:", orderItems);
      // Don't return error here as order is already created
    }

    // Clear the user's cart after successful order creation
    try {
      await prisma.cart.delete({
        where: { userId: session.user.id }
      });
    } catch (cartError: any) {
      console.error("Error clearing cart:", cartError.message, "User:", session.user.id);
      // Don't return error here as it's not critical
    }

    // Get order with related data
    const orderWithDetails = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });

    if (!orderWithDetails) {
      console.error("Order not found after creation. Order ID:", order.id);
      return NextResponse.json(
        { error: "Order not found after creation" },
        { status: 500 }
      );
    }

    const shippingAddress = await prisma.address.findUnique({
      where: { id: metadata.shippingAddressId }
    });

    if (!shippingAddress) {
      console.error("Shipping address not found after order creation. Address ID:", metadata.shippingAddressId);
      return NextResponse.json(
        { error: "Shipping address not found" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "paid",
      orderId: orderWithDetails.id,
      total: orderWithDetails.total,
      items: orderWithDetails.items.map(item => ({
        name: item.product?.name || '',
        quantity: item.quantity,
        price: Number(item.price)
      })),
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone
      },
      message: "Order processed successfully"
    });
  } catch (error: any) {
    console.error("Unhandled error processing order:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: "Failed to process order. Please contact support if you believe this is an error." },
      { status: 500 }
    );
  }
} 