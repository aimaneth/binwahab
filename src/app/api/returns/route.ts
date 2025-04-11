import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReturnStatus, PaymentStatus } from "@prisma/client";
import { ReturnValidationService } from "@/lib/services/return-validation";
import { RETURN_POLICY } from "@/lib/constants/return-policy";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause based on user role and filters
    const where = {
      ...(session.user.role !== "ADMIN" ? { userId: session.user.id } : {}),
      ...(orderId ? { orderId } : {}),
      ...(status ? { status: status as ReturnStatus } : {}),
    };

    // Get returns with detailed information
    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              total: true,
              createdAt: true,
              trackingNumber: true,
              shippingAddress: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  options: true,
                },
              },
              orderItem: {
                select: {
                  price: true,
                  quantity: true,
                },
              },
            },
          },
          refund: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.return.count({ where }),
    ]);

    return NextResponse.json({
      returns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[RETURNS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason, notes, items } = body;

    if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate return request
    const validation = await ReturnValidationService.validateReturnEligibility(order, items);
    if (!validation.isValid) {
      return new NextResponse(JSON.stringify({ errors: validation.errors }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate initial refund amount
    const refundCalculation = ReturnValidationService.calculateRefundAmount(order, items);

    // Create return and return items
    const result = await prisma.$transaction(async (tx) => {
      // Create return
      const returnRecord = await tx.return.create({
        data: {
          orderId,
          userId: session.user.id,
          status: ReturnStatus.PENDING,
        },
      });

      // Create return items
      const returnItems = await Promise.all(
        items.map(item =>
          tx.returnItem.create({
            data: {
              returnId: returnRecord.id,
              orderItemId: item.orderItemId,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              reason: item.reason || reason,
            },
          })
        )
      );

      // Create initial refund record
      const refund = await tx.refund.create({
        data: {
          returnId: returnRecord.id,
          amount: (await refundCalculation).total,
          status: PaymentStatus.PENDING,
        },
      });

      return { returnRecord, returnItems, refund, refundCalculation };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[RETURNS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { id, status, refundAmount, refundMethod } = body;

    if (!id || !status || (status === ReturnStatus.APPROVED && (!refundAmount || !refundMethod))) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if return exists
    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            orderItem: true,
          },
        },
        order: true,
        refund: true,
      },
    });

    if (!returnRecord) {
      return new NextResponse("Return not found", { status: 404 });
    }

    // Update return status and handle inventory/refund
    const result = await prisma.$transaction(async (tx) => {
      // Update return status
      const updatedReturn = await tx.return.update({
        where: { id },
        data: { status },
      });

      if (status === ReturnStatus.APPROVED) {
        // Update or create refund
        const refund = returnRecord.refund
          ? await tx.refund.update({
              where: { returnId: id },
              data: {
                amount: refundAmount,
                status: PaymentStatus.PENDING,
              },
            })
          : await tx.refund.create({
              data: {
                returnId: id,
                amount: refundAmount,
                status: PaymentStatus.PENDING,
              },
            });

        // Update inventory for each returned item
        for (const item of returnRecord.items) {
          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: "RETURN",
              notes: `Return approved for order ${returnRecord.orderId}`,
            },
          });
        }

        return { updatedReturn, refund };
      }

      return { updatedReturn };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[RETURNS_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 