import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Product, ProductVariant } from "@prisma/client";
import { headers } from "next/headers";

interface CartItem {
  product: {
    id: string | number;
    name: string;
    price: string | number;
    inventoryTracking: boolean;
    stock: number;
  };
  variant?: {
    id: string | number;
    price: string | number;
    inventoryTracking: boolean;
    stock: number;
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
    // Log the start of the request
    console.log('Starting payment intent creation...');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Authentication failed: No session found');
      return NextResponse.json(
        { error: "You must be logged in to create a payment intent" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { items, shippingAddress } = body;

    if (!items?.length) {
      console.log('No items provided in cart');
      return NextResponse.json(
        { error: "No items provided in the cart" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      console.log('No shipping address provided');
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Validate shipping address
    const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    if (missingFields.length > 0) {
      console.log('Missing shipping address fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Log shipping address validation success
    console.log('Shipping address validated successfully');

    // Get products from database
    const products = await Promise.all(
      items.map(async (item: CartItem) => {
        const productId = typeof item.product.id === 'string' ? parseInt(item.product.id) : item.product.id;
        const variantId = item.variant?.id ? (typeof item.variant.id === 'string' ? parseInt(item.variant.id) : item.variant.id) : undefined;
        
        console.log(`Fetching product: ${productId}, variant: ${variantId}`);
        
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { variants: true }
        });

        if (!product) {
          console.error(`Product not found: ${productId}`);
          throw new Error(`Product not found: ${productId}`);
        }

        return { product, variantId };
      })
    );

    // Calculate total amount and validate stock
    let subtotal = 0;
    const lineItems = items.map((item: CartItem) => {
      const productId = typeof item.product.id === 'string' ? parseInt(item.product.id) : item.product.id;
      const product = products.find(p => p.product.id === productId);
      if (!product) {
        console.log('Product not found:', productId);
        throw new Error(`Product not found: ${productId}`);
      }

      // Check product stock if no variant
      if (!item.variant?.id && product.product.inventoryTracking && product.product.stock < item.quantity) {
        console.log('Insufficient stock for product:', product.product.name);
        throw new Error(`Insufficient stock for product: ${product.product.name}`);
      }

      let variant;
      let price;
      if (item.variant?.id) {
        const variantId = typeof item.variant.id === 'string' ? parseInt(item.variant.id) : item.variant.id;
        variant = product.variants.find((v: Variant) => v.id === variantId);
        if (!variant) {
          console.log('Variant not found for product:', product.product.name);
          throw new Error(`Variant not found for product: ${product.product.name}`);
        }
        // Check variant stock
        if (variant.inventoryTracking && variant.stock < item.quantity) {
          console.log('Insufficient stock for variant of product:', product.product.name);
          throw new Error(`Insufficient stock for variant of product: ${product.product.name}`);
        }
        price = Number(variant.price);
      } else {
        price = Number(product.product.price);
        variant = {
          id: null,
        };
      }

      if (isNaN(price) || price <= 0) {
        console.log('Invalid price for product:', product.product.name, 'Price:', price);
        throw new Error(`Invalid price for product: ${product.product.name}`);
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      
      return {
        productId: item.product.id,
        variantId: item.variant?.id || null,
        quantity: item.quantity,
        total: itemTotal
      } as LineItem;
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
    if (isNaN(shipping)) {
      return NextResponse.json(
        { error: "Invalid shipping rate" },
        { status: 400 }
      );
    }

    const total = Math.round((subtotal + tax + shipping) * 100); // Convert to cents for Stripe

    if (total <= 0) {
      return NextResponse.json(
        { error: "Total amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get idempotency key from headers or generate one
    const idempotencyKey = headers().get("Idempotency-Key") || `pi_${session.user.id}_${Date.now()}`;

    try {
      // Create payment intent with improved metadata and error handling
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "myr",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: session.user.id,
          orderItems: JSON.stringify(lineItems.map((item: LineItem) => ({
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
    console.error('Detailed error in payment intent creation:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 400 }
    );
  }
}