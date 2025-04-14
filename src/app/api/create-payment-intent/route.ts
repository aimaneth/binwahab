import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeInstance } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
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
      userId: session?.user?.id || 'guest'
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

    // Calculate shipping cost
    const shippingResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: shippingAddress.address.state,
        orderValue: amount,
      }),
    });

    const shippingData = await shippingResponse.json();
    const shippingCost = shippingData.cost || 0;

    // Add shipping cost to total amount
    const totalAmount = amount + shippingCost;

    // Log amount for debugging
    console.log('Calculated amount:', totalAmount);

    const stripe = getStripeInstance();

    // Create payment intent with more detailed metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "myr",
      metadata: {
        userId: session?.user?.id || 'guest',
        items: JSON.stringify(items),
        orderTotal: totalAmount.toString(),
        shippingAddress: JSON.stringify(shippingAddress),
        shippingCost: shippingCost.toString(),
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
      shippingCost,
      totalAmount,
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