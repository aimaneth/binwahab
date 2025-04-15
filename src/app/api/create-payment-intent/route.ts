import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CartItem } from "@/types/cart";
import { headers } from "next/headers";

interface LineItem {
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a payment intent" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, shippingAddress } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: "No items provided in the cart" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Validate shipping address
    const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate and fetch products with stock check
    const productIds = items.map((item: CartItem) => item.product.id);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        variants: true
      }
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter((id: number) => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate total amount and validate stock
    let subtotal = 0;
    const lineItems = items.map((item: CartItem) => {
      const product = products.find(p => p.id === item.product.id);
      if (!product) {
        throw new Error(`Product not found: ${item.product.id}`);
      }

      let variant;
      if (item.variant?.id) {
        variant = product.variants.find(v => v.id === item.variant!.id);
        if (!variant) {
          throw new Error(`Variant not found for product: ${item.product.id}`);
        }
        // Check variant stock
        if (variant.inventoryTracking && variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for variant of product: ${product.name}`);
        }
      } else {
        variant = {
          price: product.price,
          id: null,
          stock: null,
          inventoryTracking: false
        };
      }

      const itemTotal = Number(variant.price) * item.quantity;
      subtotal += itemTotal;
      
      return {
        product_id: product.id,
        variant_id: variant.id,
        quantity: item.quantity,
        unit_price: variant.price,
        total: itemTotal
      };
    });

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
    
    let shipping = 0;
    if (shippingZone) {
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
      
      if (shippingRate) {
        shipping = Number(shippingRate.price);
      } else {
        return NextResponse.json(
          { error: "No shipping rate available for this order value" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Shipping zone not found" },
        { status: 400 }
      );
    }

    const total = Math.round((subtotal + tax + shipping) * 100); // Convert to cents for Stripe

    // Get idempotency key from headers or generate one
    const idempotencyKey = headers().get("Idempotency-Key") || `pi_${session.user.id}_${Date.now()}`;

    // Create payment intent with improved metadata and error handling
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "myr",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id,
        orderItems: JSON.stringify(lineItems.map((item: LineItem) => {
          return {
            productId: item.product_id,
            variantId: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          };
        })),
        subtotal,
        tax,
        shipping,
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
  } catch (error) {
    console.error("Payment intent creation error:", error);
    
    // Handle specific Stripe errors
    if (error instanceof stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: error.message,
          type: error.type,
          code: error.code 
        },
        { status: error.statusCode || 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create payment intent",
        type: "internal_error"
      },
      { status: 500 }
    );
  }
}