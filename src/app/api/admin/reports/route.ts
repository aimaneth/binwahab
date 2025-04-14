import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get date range from query parameters or default to last 30 days
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const start = startDate ? new Date(startDate) : thirtyDaysAgo;
    const end = endDate ? new Date(endDate) : now;

    // Fetch data for the report
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
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
                price: true,
              },
            },
            variant: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate summary statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Count orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count products sold
    const productsSold = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const productName = item.product?.name || item.variant?.name;
        if (productName) {
          acc[productName] = (acc[productName] || 0) + item.quantity;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Format the report data
    const reportData = {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      summary: {
        totalRevenue: formatPrice(totalRevenue),
        totalOrders,
        averageOrderValue: formatPrice(averageOrderValue),
        ordersByStatus,
      },
      topProducts: Object.entries(productsSold)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, quantity]) => ({ name, quantity })),
      orders: orders.map(order => ({
        id: order.id,
        date: order.createdAt.toISOString().split('T')[0],
        customer: order.user.name || order.user.email,
        total: formatPrice(order.total),
        status: order.status,
        items: order.items.map(item => ({
          product: item.product?.name || item.variant?.name || 'Unknown Product',
          quantity: item.quantity,
          price: formatPrice(item.price),
          subtotal: formatPrice(item.quantity * item.price),
        })),
      })),
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 