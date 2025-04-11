import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Order, Product, Prisma, ProductVariant } from "@prisma/client";

type ProductWithVariants = Product & {
  variants: ProductVariant[]
  stock: number | null
  lowStockThreshold: number | null
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        AND: [
          { inventoryTracking: true },
          {
            OR: [
              // Check product stock
              {
                stock: {
                  lte: 5, // Default threshold
                },
              },
              // Check variant stock
              {
                variants: {
                  some: {
                    stock: {
                      lte: 5, // Default threshold
                    },
                  },
                },
              },
            ],
          },
        ],
      } as Prisma.ProductWhereInput,
      orderBy: {
        stock: "asc",
      } as Prisma.ProductOrderByWithRelationInput,
      include: {
        variants: {
          where: {
            stock: {
              lte: 5, // Default threshold
            },
          },
        },
      },
    });

    return NextResponse.json({
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customerName: order.user.name,
        customerEmail: order.user.email,
        total: order.total,
        items: order.items.map((item) => ({
          productName: item.product?.name || "Unknown Product",
          quantity: item.quantity,
          price: item.price,
        })),
        createdAt: order.createdAt,
      })),
      lowStockProducts: lowStockProducts.map((product) => {
        const typedProduct = product as ProductWithVariants
        return {
          id: typedProduct.id,
          name: typedProduct.name,
          stock: typedProduct.stock || 0,
          lowStockThreshold: typedProduct.lowStockThreshold || 5,
          variants: typedProduct.variants.map((variant) => ({
            id: variant.id,
            stock: variant.stock,
            options: variant.options,
          })),
        }
      }),
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 