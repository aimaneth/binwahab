import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { User } from '@prisma/client';

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

    // Validate shipping address ID
    if (!shippingAddress?.id) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
    }

    // Verify shipping address belongs to user
    const address = await prisma.address.findUnique({
      where: {
        id: shippingAddress.id,
        userId: session.user.id
      }
    });

    if (!address) {
      return NextResponse.json({ error: "Shipping address not found" }, { status: 404 });
    }

    let lineItems = [];
    let subtotal = 0;

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

      subtotal += price * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'myr',
          product_data: {
            name: product.name,
            description: item.variant ? `Variant: ${item.variant.sku}` : undefined,
            metadata: {
              productId: productId.toString(),
              variantSku: item.variant?.sku
            }
          },
          unit_amount: Math.round(price * 100), // Convert to cents for Stripe
        },
        quantity: item.quantity,
      });
    }

    // Get or create Stripe customer
    const existingCustomer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        stripeCustomerId: true
      }
    });

    let customer: string;

    if (existingCustomer?.stripeCustomerId) {
      customer = existingCustomer.stripeCustomerId;
      
      // Update existing customer's shipping address
      await stripe.customers.update(customer, {
        shipping: {
          name: session.user.name || 'Shipping Address',
          address: {
            line1: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.zipCode,
            country: address.country
          }
        }
      });
    } else {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email || '',
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id
        },
        shipping: {
          name: session.user.name || 'Shipping Address',
          address: {
            line1: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.zipCode,
            country: address.country
          }
        }
      });

      // Save Stripe customer ID to database
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          stripeCustomerId: stripeCustomer.id 
        } as Partial<User>
      });

      customer = stripeCustomer.id;
    }

    // Create order items metadata
    const orderItems = lineItems.map(item => ({
      productId: parseInt(item.price_data.product_data.metadata.productId),
      variantSku: item.price_data.product_data.metadata.variantSku,
      quantity: item.quantity,
      unit_price: item.price_data.unit_amount / 100 // Convert back to dollars for our records
    }));

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer,
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/cart`,
      metadata: {
        userId: session.user.id,
        shippingAddressId: address.id,
        orderItems: JSON.stringify(orderItems),
        subtotal: subtotal.toString()
      },
      currency: 'myr',
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto'
      },
      shipping_address_collection: {
        allowed_countries: ['MY', 'SG', 'BN']  // Malaysia, Singapore, Brunei
      }
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