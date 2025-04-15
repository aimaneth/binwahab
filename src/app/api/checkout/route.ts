import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe/server";
import { z } from "zod";

const checkoutSchema = z.object({
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
    const validationResult = checkoutSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { items } = validationResult.data;

    // Create line items for Checkout Session
    const lineItems = items.map(item => ({
      quantity: item.quantity,
      price_data: {
        currency: 'myr',
        unit_amount: Math.round((item.variant?.price || item.product.price) * 100),
        product_data: {
          name: item.product.name,
          metadata: {
            productId: item.product.id.toString(),
            variantSku: item.variant?.sku || '',
          },
        },
      },
    }));

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email || undefined,
      client_reference_id: session.user.id,
      line_items: lineItems,
      success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/checkout/cancel`,
      metadata: {
        userId: session.user.id,
      },
      payment_method_types: ['card', 'fpx'],
      shipping_address_collection: {
        allowed_countries: ['MY'], // Malaysia
      },
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    if (error instanceof stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
} 