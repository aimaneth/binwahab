import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeInstance } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, shippingAddress } = body;

    if (!items?.length || !shippingAddress) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400 }
      );
    }

    // Log request data for debugging
    console.log('Creating payment intent with:', {
      items,
      shippingAddress,
      userId: session.user.id
    });

    // Validate shipping address
    const requiredFields = ['name', 'address', 'phone'];
    const addressFields = ['line1', 'city', 'state', 'postal_code', 'country'];
    
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        return new NextResponse(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400 }
        );
      }
    }

    for (const field of addressFields) {
      if (!shippingAddress.address[field]) {
        return new NextResponse(
          JSON.stringify({ error: `Missing required address field: ${field}` }),
          { status: 400 }
        );
      }
    }

    // Fetch products to calculate total
    const products = await Promise.all(
      items.map(async (item: { id: string; quantity: number }) => {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(item.id) },
          include: { variants: true },
        });
        if (!product) {
          throw new Error(`Product not found: ${item.id}`);
        }
        return { ...product, quantity: item.quantity };
      })
    );

    // Calculate total amount
    const amount = products.reduce((total, product) => {
      const price = product.price;
      return total + (Number(price) * product.quantity);
    }, 0);

    if (amount <= 0) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid order amount" }),
        { status: 400 }
      );
    }

    // Log amount for debugging
    console.log('Calculated amount:', amount);

    const stripe = getStripeInstance();

    // Create payment intent with more detailed metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "myr",
      metadata: {
        userId: session.user.id,
        items: JSON.stringify(items),
        orderTotal: amount.toString(),
        shippingAddress: JSON.stringify(shippingAddress),
      },
      shipping: {
        name: shippingAddress.name,
        address: {
          line1: shippingAddress.address.line1,
          city: shippingAddress.address.city,
          state: shippingAddress.address.state,
          postal_code: shippingAddress.address.postal_code,
          country: shippingAddress.address.country,
        },
        phone: shippingAddress.phone,
      },
      payment_method_types: ['card', 'fpx'],
      payment_method_options: {
        fpx: {
          setup_future_usage: 'none'
        }
      }
    });

    // Log success for debugging
    console.log('Payment intent created:', paymentIntent.id);

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[STRIPE_ERROR]", error);
    // Return more detailed error information
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal Error',
        details: error instanceof Error ? error.stack : undefined
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 