import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from 'stripe';
import { createCurlecOrder } from "@/lib/curlec/server";

export const dynamic = 'force-dynamic';

// Initialize Stripe if needed
let stripeClient: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
  });
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!stripeClient) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

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

// Define the expected item structure
interface CheckoutItem {
  id: string;
  quantity: number;
  variantId?: string;
  name: string;
  price: number;
  description?: string;
  images?: Array<string | { url: string }>;
  variant?: {
    id: string;
    sku: string;
    name: string;
    options: Record<string, string>;
  };
}

interface CheckoutRequest {
  items: CheckoutItem[];
  shippingAddressId: string;
  paymentGateway?: "stripe" | "curlec"; // Default to Stripe if not specified
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received checkout request:', body);

    const { items, shippingAddressId, paymentGateway = "stripe" } = body as CheckoutRequest;

    if (!items?.length) {
      console.log('No items provided in request');
      return NextResponse.json(
        { error: 'Please provide items to purchase' },
        { status: 400 }
      );
    }

    if (!shippingAddressId) {
      return NextResponse.json(
        { error: 'Please provide a shipping address' },
        { status: 400 }
      );
    }

    // Verify shipping address belongs to user
    const address = await prisma.address.findUnique({
      where: {
        id: shippingAddressId,
        userId: session.user.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: "Invalid shipping address" },
        { status: 400 }
      );
    }

    // Calculate subtotal and tax
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.06; // 6% Malaysian GST
    const shippingCost = 10; // RM10 shipping
    const totalAmount = subtotal + tax + shippingCost;

    // Process based on selected payment gateway
    if (paymentGateway === "curlec") {
      return await handleCurlecCheckout(session.user.id, totalAmount, items, address);
    } else {
      // Default to Stripe
      return await handleStripeCheckout(session.user.id, session.user.email, items, address, subtotal, tax);
    }
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

async function handleCurlecCheckout(
  userId: string, 
  totalAmount: number, 
  items: CheckoutItem[], 
  address: any
) {
  try {
    // Create Curlec order
    const order = await createCurlecOrder(totalAmount, "MYR", `order_${Date.now()}`);

    // Store order info in database
    const newOrder = await prisma.order.create({
      data: {
        userId,
        total: totalAmount,
        shippingAddressId: address.id,
        paymentMethod: "CREDIT_CARD", // Using CREDIT_CARD as default
        currency: "myr",
        stripeSessionId: order.id, // Store Curlec order ID in stripeSessionId field
        status: "PENDING",
        items: {
          create: items.map(item => ({
            quantity: item.quantity,
            price: item.price,
            productId: parseInt(item.id, 10),
            variantId: item.variantId ? parseInt(item.variantId, 10) : null,
            currency: "myr"
          }))
        }
      }
    });

    console.log('Curlec checkout order created:', {
      orderId: newOrder.id,
      curlecOrderId: order.id
    });

    return NextResponse.json({ 
      success: true,
      orderId: newOrder.id,
      curlecOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      gateway: "curlec"
    });
  } catch (error) {
    console.error('Error creating Curlec checkout:', error);
    throw error;
  }
}

async function handleStripeCheckout(
  userId: string,
  userEmail: string | null | undefined,
  items: CheckoutItem[], 
  address: any, 
  subtotal: number, 
  tax: number
) {
  if (!stripeClient) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  // Create line items with base prices and variant information
  const lineItems = items.map((item: CheckoutItem) => {
    const variantInfo = item.variant 
      ? `\nSKU: ${item.variant.sku}${Object.entries(item.variant.options)
          .map(([key, value]) => `\n${key}: ${value}`)
          .join('')}`
      : '';

    // Process image URLs to ensure they're in the correct format for Stripe
    let productImages: string[] = [];
    if (item.images && item.images.length > 0) {
      productImages = item.images.map(img => {
        // Handle both string and object formats for image URLs
        if (typeof img === 'string') {
          return img;
        } else if (typeof img === 'object' && img !== null && img !== undefined) {
          // Use type assertion with interface to properly handle the object
          const imgObj = img as { url?: string };
          return imgObj.url || '';
        }
        return '';
      }).filter(Boolean); // Remove empty strings
    }

    return {
      price_data: {
        currency: 'myr',
        product_data: {
          name: item.name || 'Unknown Product',
          description: (item.description || '') + variantInfo,
          images: productImages.length ? [productImages[0]] : [],
        },
        unit_amount: Math.round(item.price * 100), // Base price in cents
      },
      quantity: item.quantity || 1,
    };
  });

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
  const checkoutSession = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card', 'fpx'],
    locale: 'en',
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://binwahab.com'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://binwahab.com'}/shop/cart`,
    customer_email: userEmail || undefined,
    metadata: {
      userId,
      shippingAddressId: address.id,
      shippingAddress: JSON.stringify({
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        phone: address.phone,
      }),
      items: JSON.stringify(items.map(item => ({
        productId: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price * 100, // Store price in cents to match Stripe's format
      }))),
    },
  });

  console.log('Stripe checkout session created:', {
    sessionId: checkoutSession.id,
    url: checkoutSession.url
  });

  return NextResponse.json({ 
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
    gateway: "stripe"
  });
} 