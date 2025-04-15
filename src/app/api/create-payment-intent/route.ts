import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

interface CartItem {
  product: {
    id: number | string;
    name: string;
    price: string | number;
  };
  variant?: {
    sku: string;
    price: string | number;
  };
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, shippingAddress } = await request.json();
    if (!items?.length) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Validate shipping address
    if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.state || 
        !shippingAddress?.zipCode || !shippingAddress?.country) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
    }

    let lineItems = [];

    // Process each item in the cart
    for (const item of items) {
      const productId = Number(item.product.id);
      if (isNaN(productId)) {
        return NextResponse.json({ error: `Invalid product ID: ${item.product.id}` }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true }
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      const price = Number(item.variant?.price || item.product.price);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: `Invalid price for product: ${product.name}` }, { status: 400 });
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: item.variant ? `Variant: ${item.variant.sku}` : undefined,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: session.user.id,
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        userId: session.user.id,
        shippingAddress: JSON.stringify(shippingAddress)
      },
      shipping_address_collection: {
        allowed_countries: ['US'], // Adjust based on your supported countries
      },
      billing_address_collection: 'required',
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}