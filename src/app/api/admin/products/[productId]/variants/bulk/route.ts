import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  variantIds: z.array(z.number()),
  data: z.object({
    price: z.number().optional(),
    compareAtPrice: z.number().nullable().optional(),
    stock: z.number().optional(),
    lowStockThreshold: z.number().optional(),
    isActive: z.boolean().optional(),
    inventoryTracking: z.boolean().optional(),
  }),
});

const bulkDeleteSchema = z.object({
  variantIds: z.array(z.number()),
});

export async function PUT(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { variantIds, data } = bulkUpdateSchema.parse(body);

    // Convert numeric values to Decimal strings for Prisma
    const prismaData = {
      ...data,
      price: data.price !== undefined ? data.price.toString() : undefined,
      compareAtPrice: data.compareAtPrice !== undefined ? data.compareAtPrice?.toString() : undefined,
    };

    // Create inventory transactions for stock updates if needed
    if (data.stock !== undefined) {
      await Promise.all(
        variantIds.map(async (variantId) => {
          const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            select: { stock: true },
          });

          if (!variant) return;

          const stockDiff = data.stock! - variant.stock;
          if (stockDiff !== 0) {
            await prisma.inventoryTransaction.create({
              data: {
                variantId,
                quantity: Math.abs(stockDiff),
                type: stockDiff > 0 ? "ADJUSTMENT" : "ADJUSTMENT",
                notes: "Bulk update adjustment",
              },
            });
          }
        })
      );
    }

    // Update all selected variants
    await prisma.productVariant.updateMany({
      where: {
        id: { in: variantIds },
        productId: parseInt(params.productId),
      },
      data: prismaData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[VARIANTS_BULK_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { variantIds } = bulkDeleteSchema.parse(body);

    // Check if any variants have orders or are in carts
    const variantsInUse = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        OR: [
          { orderItems: { some: {} } },
          { cartItems: { some: {} } },
        ],
      },
      select: {
        id: true,
        sku: true,
      },
    });

    if (variantsInUse.length > 0) {
      return new NextResponse(
        JSON.stringify({
          message: "Some variants cannot be deleted because they are in use",
          variants: variantsInUse,
        }),
        { status: 400 }
      );
    }

    // Delete all selected variants
    await prisma.productVariant.deleteMany({
      where: {
        id: { in: variantIds },
        productId: parseInt(params.productId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[VARIANTS_BULK_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 