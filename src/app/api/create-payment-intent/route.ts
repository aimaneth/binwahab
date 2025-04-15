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

    let total = 0;
    const lineItems = [];

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

      const price = item.variant?.price || item.product.price;
      const itemTotal = Number(price) * item.quantity;

      if (isNaN(itemTotal) || itemTotal <= 0) {
        return NextResponse.json({ error: `Invalid price for product: ${product.name}` }, { status: 400 });
      }

      total += itemTotal;
      lineItems.push({
        productId,
        name: product.name,
        price: Number(price),
        quantity: item.quantity,
        total: itemTotal,
        variantSku: item.variant?.sku
      });
    }

    if (total <= 0) {
      return NextResponse.json({ error: "Total amount must be greater than 0" }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: "usd",
      customer: session.user.id,
      metadata: {
        userId: session.user.id,
        orderItems: JSON.stringify(lineItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price.toString(),
          quantity: item.quantity,
          total: item.total.toString(),
          variantSku: item.variantSku
        }))),
        shippingAddress: JSON.stringify(shippingAddress)
      }
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}