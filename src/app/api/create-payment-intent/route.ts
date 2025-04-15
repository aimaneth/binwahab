import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Product, ProductVariant } from "@prisma/client";
import { headers } from "next/headers";

interface CartItem {
  id: string | number;
  product: {
    id?: string | number;
    name: string;
    price: string | number;
    inventoryTracking?: boolean;
    stock?: number;
  };
  variant?: {
    id?: string | number;
    sku: string;
    price: string | number;
    inventoryTracking?: boolean;
    stock?: number;
  };
  quantity: number;
}

interface LineItem {
  id: string;
  productId: string | number;
  variantId?: string | number;
  quantity: number;
  total?: number;
}

interface Variant {
  id: string | number;
  price: string | number;
  inventoryTracking: boolean;
  stock: number;
}

export async function POST(req: Request) {
  try {
    console.log('=== Payment Intent Creation Debug ===');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a payment intent" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('Request body:', {
      items: body.items,
      shippingAddress: body.shippingAddress
    });

    const { items, shippingAddress } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty items array" },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json(
        { error: "Invalid shipping address structure" },
        { status: 400 }
      );
    }

    const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required shipping address fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate total amount and validate stock
    let subtotal = 0;
    const lineItems: LineItem[] = [];

    for (const item of items) {
      console.log('Processing item:', item);
      
      const productId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
      console.log('Looking up product:', productId);

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true }
      });

      if (!product) {
        console.log('Product not found:', productId);
        return NextResponse.json(
          { error: `Product not found: ${productId}` },
          { status: 400 }
        );
      }

      let price: number;
      if (item.variant) {
        const variant = product.variants.find(v => v.sku === item.variant?.sku);
        if (!variant) {
          return NextResponse.json(
            { error: `Variant not found for product: ${product.name}` },
            { status: 400 }
          );
        }
        price = Number(variant.price);
      } else {
        price = Number(product.price);
      }

      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { error: `Invalid price for product: ${product.name}` },
          { status: 400 }
        );
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      lineItems.push({
        id: item.id.toString(),
        productId: productId,
        variantId: item.variant?.id,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Calculate tax and shipping
    const tax = subtotal * 0.06; // 6% tax
    
    // Get shipping cost based on address
    const zoneType = shippingAddress.state.toLowerCase().includes('sabah') || 
                    shippingAddress.state.toLowerCase().includes('sarawak') ? 
                    'EAST_MALAYSIA' : 'WEST_MALAYSIA';
                    
    const shippingZone = await prisma.shippingZone.findFirst({
      where: {
        type: zoneType,
        isActive: true
      },
    });
    
    if (!shippingZone) {
      return NextResponse.json(
        { error: "Shipping zone not found for the provided address" },
        { status: 400 }
      );
    }

    const shippingRate = await prisma.shippingRate.findFirst({
      where: {
        zoneId: shippingZone.id,
        minOrderValue: {
          lte: subtotal,
        },
        maxOrderValue: {
          gte: subtotal,
        },
        isActive: true
      },
      orderBy: {
        minOrderValue: 'desc',
      },
    });
    
    if (!shippingRate) {
      return NextResponse.json(
        { error: "No shipping rate available for this order value" },
        { status: 400 }
      );
    }

    const shipping = Number(shippingRate.price);
    const total = Math.round((subtotal + tax + shipping) * 100); // Convert to cents for Stripe

    if (total <= 0) {
      return NextResponse.json(
        { error: "Total amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Create payment intent
    const idempotencyKey = headers().get("Idempotency-Key") || `pi_${session.user.id}_${Date.now()}`;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "myr",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: session.user.id,
          orderItems: JSON.stringify(lineItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unit_price: item.total ? item.total / item.quantity : undefined
          }))),
          subtotal: subtotal.toString(),
          tax: tax.toString(),
          shipping: shipping.toString(),
          shippingZone: zoneType,
          shippingAddress: JSON.stringify(shippingAddress)
        },
        statement_descriptor: "BINWAHAB STORE",
        statement_descriptor_suffix: "Order",
        description: `Order for ${session.user.email}`,
      }, {
        idempotencyKey
      });

      return NextResponse.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: total,
        subtotal,
        tax,
        shipping
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json(
        { error: stripeError.message || "Failed to create payment intent" },
        { status: stripeError.statusCode || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in payment intent creation:', error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 400 }
    );
  }
}