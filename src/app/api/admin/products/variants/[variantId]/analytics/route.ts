import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { OrderStatus, TransactionType } from "@prisma/client";

interface InventoryRecord {
  date: string;
  stock: number;
  type: TransactionType;
}

interface SalesRecord {
  date: string;
  quantity: number;
  revenue: number;
}

export async function GET(
  req: Request,
  { params }: { params: { variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "30d";
    const days = timeframe === "7d" ? 7 : timeframe === "90d" ? 90 : 30;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const variantId = parseInt(params.variantId);

    // Get sales data
    const orderItems = await prisma.orderItem.findMany({
      where: {
        variantId,
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: OrderStatus.DELIVERED,
        },
      },
      include: {
        order: {
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: {
        order: {
          createdAt: "asc",
        },
      },
    });

    // Get inventory transactions
    const inventoryTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        variantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate daily sales
    const salesByDay = new Map<string, { quantity: number; revenue: number }>();
    orderItems.forEach((item) => {
      const date = item.order.createdAt.toISOString().split("T")[0];
      const existing = salesByDay.get(date) || { quantity: 0, revenue: 0 };
      salesByDay.set(date, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.price * item.quantity,
      });
    });

    // Fill in missing days with zero values
    const sales: SalesRecord[] = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      const date = currentDate.toISOString().split("T")[0];
      const dayData = salesByDay.get(date) || { quantity: 0, revenue: 0 };
      sales.push({
        date,
        ...dayData,
      });
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    // Calculate inventory history
    const inventory: InventoryRecord[] = [];
    let runningStock = (await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    }))?.stock || 0;

    // Work backwards from current stock
    inventoryTransactions.reverse().forEach((transaction) => {
      const date = transaction.createdAt.toISOString().split("T")[0];
      if (transaction.type === "SALE" || transaction.type === "ADJUSTMENT") {
        runningStock += transaction.quantity;
      } else {
        runningStock -= transaction.quantity;
      }
      inventory.unshift({
        date,
        stock: runningStock,
        type: transaction.type,
      });
    });

    // Calculate metrics
    const totalSales = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate stock turnover rate
    const stockTurnover = totalSales / (runningStock || 1);

    return NextResponse.json({
      sales,
      inventory,
      metrics: {
        totalSales,
        totalRevenue,
        averageOrderValue,
        stockTurnoverRate: stockTurnover,
      },
    });
  } catch (error) {
    console.error("[VARIANT_ANALYTICS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 