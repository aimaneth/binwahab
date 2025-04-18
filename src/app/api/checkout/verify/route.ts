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
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Retrieve the Checkout Session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: "Checkout session not found" },
        { status: 404 }
      );
    }

    // Check payment status first
    if (checkoutSession.payment_status !== "paid") {
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
      return NextResponse.json(
        { error: "Invalid shipping address" },
        { status: 400 }
      );
    }

    // Parse items from metadata
    let orderItems: any[] = [];
    try {
      orderItems = metadata.items ? JSON.parse(metadata.items) : [];
    } catch (error) {
      console.error("Error parsing order items from metadata:", error);
      return NextResponse.json(
        { error: "Invalid order items data" },
        { status: 400 }
      );
    }

    // Create order with items and shipping address
    const order = await prisma.order.create({
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

    // Update stock levels using the already parsed orderItems
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

    // Clear the user's cart after successful order creation
    await prisma.cart.delete({
      where: { userId: session.user.id }
    });

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
      throw new Error("Order not found after creation");
    }

    const shippingAddress = await prisma.address.findUnique({
      where: { id: metadata.shippingAddressId }
    });

    if (!shippingAddress) {
      throw new Error("Shipping address not found");
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
  } catch (error) {
    console.error("Error processing order:", error);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
} 