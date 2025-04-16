import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    image?: string;
    description?: string;
  };
  variant?: {
    id: string;
    sku: string;
    name: string;
    price: string;
    image?: string;
  };
}

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
    const { items } = body as { items: OrderItem[] };

    if (!items?.length) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Create line items for Stripe Checkout
    const lineItems = items.map(item => ({
      quantity: item.quantity,
      price_data: {
        currency: 'myr',
        unit_amount: Math.round(parseFloat(item.variant?.price || item.product.price) * 100),
        product_data: {
          name: item.product.name,
          description: item.product.description || undefined,
          images: item.variant?.image || item.product.image ? 
            [item.variant?.image || item.product.image].filter((img): img is string => !!img) : 
            undefined,
          metadata: {
            productId: item.product.id,
            variantSku: item.variant?.sku || '',
          },
        },
      },
    }));

    // Calculate shipping cost
    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.variant?.price || item.product.price);
      return sum + (price * item.quantity);
    }, 0);

    // Add shipping line item if total is less than RM300
    if (subtotal < 300) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'myr',
          unit_amount: 2000, // RM20.00
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping (2-5 business days)',
            images: [],
            metadata: {
              productId: 'shipping',
              variantSku: '',
            },
          },
        },
      });
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email || undefined,
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout/cancel`,
      metadata: {
        userId: session.user.id,
      },
      shipping_address_collection: {
        allowed_countries: ['MY'], // Malaysia only
      },
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        shipping_address: {
          message: 'Please enter your complete shipping address for delivery.',
        },
        submit: {
          message: 'We\'ll send your order confirmation via email.',
        },
      },
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session');
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 