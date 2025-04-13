import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cartItemSchema = z.object({
  variantId: z.number().optional(),
  productId: z.string().transform((val) => parseInt(val)).optional(),
  quantity: z.number().min(1),
}).refine(data => data.variantId || data.productId, {
  message: "Either variantId or productId must be provided"
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
    const { variantId, productId, quantity } = cartItemSchema.parse(body);

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

    if (variantId) {
      // Check if variant exists and has enough stock
      const variant = await prisma.productVariant.findUnique({
        where: {
          id: variantId,
        },
        include: {
          product: true,
        },
      });

      if (!variant) {
        return NextResponse.json(
          { message: "Variant not found" },
          { status: 404 }
        );
      }

      if (variant.stock < quantity) {
        return NextResponse.json(
          { message: "Not enough stock" },
          { status: 400 }
        );
      }

      // Check if variant is already in cart
      const existingItem = cart.items.find(
        (item) => item.variantId === variantId
      );

      if (existingItem) {
        // Update quantity
        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + quantity,
          },
        });
      } else {
        // Add new item
        await prisma.cartItem.create({
          data: {
            cart: {
              connect: {
                id: cart.id
              }
            },
            product: {
              connect: {
                id: variant.productId
              }
            },
            variant: {
              connect: {
                id: variantId
              }
            },
            user: {
              connect: {
                id: session.user.id
              }
            },
            quantity,
          },
        });
      }
    } else if (productId) {
      // Check if product exists and has enough stock
      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return NextResponse.json(
          { message: "Product not found" },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          { message: "Not enough stock" },
          { status: 400 }
        );
      }

      // Check if product is already in cart
      const existingItem = cart.items.find(
        (item) => item.productId === productId && !item.variantId
      );

      if (existingItem) {
        // Update quantity
        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + quantity,
          },
        });
      } else {
        // Add new item
        await prisma.cartItem.create({
          data: {
            cart: {
              connect: {
                id: cart.id
              }
            },
            product: {
              connect: {
                id: productId
              }
            },
            user: {
              connect: {
                id: session.user.id
              }
            },
            quantity,
          },
        });
      }
    }

    return NextResponse.json(
      { message: "Added to cart successfully" },
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
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
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
    const { itemId, quantity } = z
      .object({
        itemId: z.string(),
        quantity: z.number().min(0),
      })
      .parse(body);

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: parseInt(itemId),
      },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { message: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: {
          id: parseInt(itemId),
        },
      });
    } else {
      if (cartItem.product && cartItem.product.stock < quantity) {
        return NextResponse.json(
          { message: "Not enough stock" },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: {
          id: parseInt(itemId),
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
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: parseInt(itemId),
      },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { message: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: parseInt(itemId),
      },
    });

    return NextResponse.json(
      { message: "Item removed from cart" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 