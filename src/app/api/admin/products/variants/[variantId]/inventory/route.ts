import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  quantity: z.number(),
  type: z.enum(["PURCHASE", "SALE", "RETURN", "ADJUSTMENT", "RESERVED", "RELEASED"]),
  reason: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionInput = z.infer<typeof transactionSchema>;

export async function POST(
  request: Request,
  { params }: { params: { variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    const variant = await prisma.productVariant.findUnique({
      where: { id: parseInt(params.variantId) },
    });

    if (!variant) {
      return new NextResponse("Variant not found", { status: 404 });
    }

    // Calculate new stock level based on transaction type
    let newStock = variant.stock;
    let newReservedStock = variant.reservedStock;

    switch (validatedData.type) {
      case "ADJUSTMENT":
      case "PURCHASE":
        newStock = variant.stock + validatedData.quantity;
        break;
      case "SALE":
        newStock = variant.stock - validatedData.quantity;
        newReservedStock = variant.reservedStock - validatedData.quantity;
        break;
      case "RETURN":
        newStock = variant.stock + validatedData.quantity;
        break;
      case "RESERVED":
        newReservedStock = variant.reservedStock + validatedData.quantity;
        break;
      case "RELEASED":
        newReservedStock = variant.reservedStock - validatedData.quantity;
        break;
    }

    // Validate stock levels
    if (newStock < 0 || newReservedStock < 0) {
      return new NextResponse("Invalid stock adjustment", { status: 400 });
    }

    // Create transaction and update variant in a transaction
    const result = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          variantId: parseInt(params.variantId),
          quantity: validatedData.quantity,
          type: validatedData.type,
          notes: validatedData.notes,
          reference: validatedData.reference,
        },
      }),
      prisma.productVariant.update({
        where: { id: parseInt(params.variantId) },
        data: {
          stock: newStock,
          reservedStock: newReservedStock,
        },
      }),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [transactions, total] = await prisma.$transaction([
      prisma.inventoryTransaction.findMany({
        where: { variantId: parseInt(params.variantId) },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryTransaction.count({
        where: { variantId: parseInt(params.variantId) },
      }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
} 