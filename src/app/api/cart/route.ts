import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withFreshConnection, safeExecute } from "@/lib/prisma";
import { z } from "zod";
import { CartItem } from "@/types/cart";

const cartItemSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  ),
  variantId: z.number().optional(),
  quantity: z.number().min(1),
});

// Helper function to get user ID consistently
function getUserId(session: any): string | null {
  return session?.user?.id || session?.user?.email || null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { message: "User ID not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, variantId, quantity } = cartItemSchema.parse(body);

    try {
      const result = await safeExecute(async (prismaClient) => {
        // Get or create cart
        let cart = await prismaClient.cart.findUnique({
          where: { userId },
          include: { items: true },
        });

        if (!cart) {
          cart = await prismaClient.cart.create({
            data: { userId },
            include: { items: true },
          });
        }

        // Find the product
        const product = await prismaClient.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        // If variant is specified, validate it
        if (variantId) {
          const variant = product.variants.find((v: any) => v.id === variantId);
          if (!variant) {
            throw new Error("Variant not found");
          }
        }

        // Check if item already exists in cart
        const existingItem = cart.items.find((item: any) => 
          item.productId === productId && 
          item.variantId === variantId
        );

        if (existingItem) {
          // Update quantity
          await prismaClient.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
          });
        } else {
          // Add new item
          await prismaClient.cartItem.create({
            data: {
              cartId: cart.id,
              userId,
              productId,
              variantId,
              quantity,
            },
          });
        }

        return { message: "Item added to cart" };
      });
      
      return NextResponse.json(result, { status: 200 });
      
    } catch (error: any) {
      // Handle specific errors
      if (error.message === "Product not found") {
        return NextResponse.json({ message: "Product not found" }, { status: 404 });
      }
      if (error.message === "Variant not found") {
        return NextResponse.json({ message: "Variant not found" }, { status: 404 });
      }
      
      console.error('Cart operation failed:', error);
      return NextResponse.json(
        { message: "Unable to add item to cart. Please try again." },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error("Cart POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to add item to cart. Please try again." },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ items: [] });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ items: [] });
    }

    const cart = await safeExecute(async (prismaClient) => {
      return await prismaClient.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(cart || { items: [] });
    
  } catch (error: any) {
    console.error("Cart API error:", error);
    return NextResponse.json({ items: [] });
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
    const variantId = searchParams.get('variantId');
    const clearAll = searchParams.get('clearAll');

    // If clearAll is true, delete the entire cart
    if (clearAll === 'true') {
      await prisma.cart.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      return NextResponse.json(
        { message: "Cart cleared successfully" },
        { status: 200 }
      );
    }

    // Otherwise, proceed with deleting a single item
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

    // Debug logging: print all cart items and the incoming IDs
    console.log('Cart Items Debug:', cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId
    })));
    console.log('Delete Request:', { productId, variantId });

    // Find the cart item to delete
    const cartItem = cart.items.find(item => 
      item.productId && item.productId.toString() === productId &&
      (!variantId || (item.variantId && item.variantId.toString() === variantId))
    );

    if (!cartItem) {
      return NextResponse.json(
        { message: "Item not found in cart" },
        { status: 404 }
      );
    }

    // Delete the cart item
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
    console.error("[CART_DELETE]", error);
    return NextResponse.json(
      { message: "Failed to remove item" },
      { status: 500 }
    );
  }
} 