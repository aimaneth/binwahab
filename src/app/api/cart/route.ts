import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CartItem } from "@/types/cart";

const cartItemSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  ),
  variantId: z.number().optional(),
  quantity: z.number().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, variantId, quantity } = cartItemSchema.parse(body);

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: {
          items: true,
        },
      });
    }

    // Find the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // If variant is specified, validate it
    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) {
        return NextResponse.json(
          { message: "Variant not found" },
          { status: 404 }
        );
      }
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
      item.productId === productId && 
      item.variantId === variantId
    );

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          userId: session.user.id,
          productId,
          variantId,
          quantity,
        },
      });
    }

    return NextResponse.json(
      { message: "Item added to cart" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    // Transform to match CartItem type
    const items = cart.items
      .filter(item => item.product !== null)
      .map(item => {
        // Collect all product images
        const productImages = [
          ...(item.product!.images?.map(img => img.url) || []),
          ...(item.product!.image ? [item.product!.image] : [])
        ];

        console.log('Cart API Debug:', {
          productName: item.product!.name,
          rawProductImages: item.product!.images,
          rawProductImage: item.product!.image,
          processedImages: productImages,
          variantImages: item.variant?.images,
        });

        return {
          id: item.id.toString(),
          product: {
            id: item.product!.id.toString(),
            name: item.product!.name,
            price: item.product!.price.toString(),
            image: productImages[0] || undefined,
            images: productImages.map(url => ({ url })),
            description: item.product!.description || undefined,
          },
          variant: item.variant ? {
            id: item.variant.id.toString(),
            sku: item.variant.sku,
            name: item.variant.name,
            price: item.variant.price.toString(),
            image: item.variant.images?.[0] || undefined,
            options: item.variant.options as Record<string, string> || undefined,
          } : undefined,
          quantity: item.quantity,
        };
      });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, quantity } = z.object({
      productId: z.union([z.string(), z.number()]).transform(val => 
        typeof val === 'string' ? parseInt(val) : val
      ),
      quantity: z.number().min(0),
    }).parse(body);

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found" },
        { status: 404 }
      );
    }

    const cartItem = cart.items.find(item => item.productId === productId);

    if (!cartItem) {
      return NextResponse.json(
        { message: "Item not found in cart" },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: {
          id: cartItem.id,
        },
      });
    } else {
      await prisma.cartItem.update({
        where: {
          id: cartItem.id,
        },
        data: {
          quantity,
        },
      });
    }

    return NextResponse.json(
      { message: "Cart updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found" },
        { status: 404 }
      );
    }

    const cartItem = cart.items.find(item => item.productId === parseInt(productId));

    if (!cartItem) {
      return NextResponse.json(
        { message: "Item not found in cart" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return NextResponse.json(
      { message: "Item removed from cart" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to remove item" },
      { status: 500 }
    );
  }
} 