import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
              },
            },
            variant: {
              select: {
                name: true,
                images: true,
                options: true,
              },
            },
          },
        },
        shippingAddress: {
          select: {
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { shippingInfo, paymentInfo } = body;

    // Get the user's cart
    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return new NextResponse("Cart is empty", { status: 400 });
    }

    // Filter out items with null products
    const validItems = cart.items.filter((item): item is (typeof item & { product: NonNullable<typeof item.product> }) => item.product !== null);

    // Calculate order total
    const subtotal = validItems.reduce(
      (sum, item) => sum + Number(item.variant?.price ?? item.product.price) * item.quantity,
      0
    );
    const tax = subtotal * 0.06; // 6% tax
    
    // Get shipping cost
    const zoneType = shippingInfo.state.toLowerCase().includes('sabah') || 
                    shippingInfo.state.toLowerCase().includes('sarawak') ? 
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
        shipping = shippingRate.price;
      }
    }
    
    const total = subtotal + tax + shipping;

    // Create or update shipping address
    let addressId = shippingInfo.addressId;
    if (!addressId) {
      const address = await prisma.address.create({
        data: {
          userId: session.user.id,
          street: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.postalCode,
          country: shippingInfo.country,
          phone: shippingInfo.phone,
        },
      });
      addressId = address.id;
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        total: total,
        shippingAddressId: addressId,
        paymentMethod: paymentInfo.paymentMethod,
        items: {
          create: validItems.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id ?? null,
            quantity: item.quantity,
            price: Number(item.variant?.price ?? item.product.price),
          })),
        },
      },
    });

    // Clear the cart
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("[ORDERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 