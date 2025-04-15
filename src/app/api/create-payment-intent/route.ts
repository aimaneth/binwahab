import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent, getOrCreateCustomer } from "@/lib/stripe/server";
import { CreatePaymentIntentData } from "@/lib/stripe/config";
import { z } from "zod";
import Stripe from "stripe";

// Validation schema for request body
const createPaymentIntentSchema = z.object({
  items: z.array(z.object({
    product: z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      price: z.union([z.string(), z.number()]).transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      ),
    }),
    variant: z.object({
      sku: z.string(),
      price: z.union([z.string(), z.number()]).transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      ),
    }).optional(),
    quantity: z.number().int().positive(),
  })),
  shippingAddress: z.object({
    id: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createPaymentIntentSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { items, shippingAddress } = validationResult.data;

    // Verify shipping address belongs to user
    const address = await prisma.address.findUnique({
      where: {
        id: shippingAddress.id,
        userId: session.user.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: "Shipping address not found" },
        { status: 404 }
      );
    }

    // Calculate total amount
    let subtotal = 0;
    const orderItems = [];

    // Process each item in the cart
    for (const item of items) {
      const productId = Number(item.product.id);
      if (isNaN(productId)) {
        return NextResponse.json(
          { error: `Invalid product ID: ${item.product.id}` },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${productId}` },
          { status: 404 }
        );
      }

      const price = item.variant?.price || item.product.price;
      if (isNaN(price) || price <= 0) {
        console.error(`Invalid price for product ${product.name}:`, price);
        return NextResponse.json(
          { error: `Invalid price for product: ${product.name}` },
          { status: 400 }
        );
      }

      subtotal += price * item.quantity;

      orderItems.push({
        productId: productId.toString(),
        variantSku: item.variant?.sku,
        quantity: item.quantity,
        unit_price: price
      });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      session.user.id,
      session.user.email!,
      session.user.name || undefined
    );

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      subtotal,
      'myr',
      customerId,
      {
        userId: session.user.id,
        shippingAddressId: address.id,
        orderItems: JSON.stringify(orderItems),
        subtotal: subtotal.toString()
      }
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    
    // Handle specific error types
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: error.statusCode || 500 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}