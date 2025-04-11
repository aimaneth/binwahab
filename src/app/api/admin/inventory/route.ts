import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get inventory transactions
    const where = productId ? { productId: parseInt(productId) } : {};
    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              stock: true,
              reservedStock: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 5, // Default low stock threshold
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      lowStockProducts,
    });
  } catch (error) {
    console.error("[INVENTORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, type, notes, reference } = body;

    if (!productId || !quantity || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Start a transaction to update inventory and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Get the product
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true, reservedStock: true },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Calculate new stock based on transaction type
      let newStock = product.stock || 0;
      let newReservedStock = product.reservedStock || 0;

      switch (type) {
        case "PURCHASE":
          newStock += quantity;
          break;
        case "SALE":
          newStock -= quantity;
          break;
        case "RETURN":
          newStock += quantity;
          break;
        case "ADJUSTMENT":
          newStock = quantity;
          break;
        case "RESERVED":
          newReservedStock += quantity;
          break;
        case "RELEASED":
          newReservedStock -= quantity;
          break;
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
          reservedStock: newReservedStock,
        },
      });

      // Create inventory transaction record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          quantity,
          type,
          notes,
          reference,
        },
      });

      return { updatedProduct, transaction };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[INVENTORY_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 