export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { addDays, format, subDays } from "date-fns";
import { redis } from "@/lib/redis";

const CACHE_TTL = 5 * 60; // 5 minutes cache

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = new Date(searchParams.get("start") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(searchParams.get("end") || new Date());

    // Try to get cached data first
    const cacheKey = `analytics:${start.toISOString()}:${end.toISOString()}`;
    let cachedData = null;
    
    if (redis) {
      cachedData = await redis.get(cacheKey);
    }

    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // If no cached data, calculate analytics
    const analytics = await calculateAnalytics(start, end);

    // Cache the results if Redis is available
    if (redis) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(analytics));
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[ANALYTICS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

async function getSalesAnalytics(start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: OrderStatus.DELIVERED,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });

  const salesByDay = orders.reduce((acc, order) => {
    const day = order.createdAt.toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    return acc;
  }, {} as Record<string, number>);

  const salesByCategory = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (item.product?.category?.name) {
        const categoryName = item.product.category.name;
        acc[categoryName] = (acc[categoryName] || 0) + (item.quantity * item.price);
      }
    });
    return acc;
  }, {} as Record<string, number>);

  return { salesByDay, salesByCategory };
}

async function getCustomerAnalytics(start: Date, end: Date) {
  const customersByDay = await prisma.user.groupBy({
    by: ["createdAt"],
    where: {
      role: "USER",
      createdAt: { gte: start, lte: end },
    },
    _count: true,
    orderBy: { createdAt: "asc" },
  });

  return { customersByDay };
}

async function getProductAnalytics(start: Date, end: Date) {
  const topProducts = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.price,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM Product p
    JOIN OrderItem oi ON p.id = oi.productId
    JOIN Order o ON oi.orderId = o.id
    WHERE o.createdAt BETWEEN ${start} AND ${end}
      AND o.status = ${OrderStatus.DELIVERED}
    GROUP BY p.id, p.name, p.price
    ORDER BY total_revenue DESC
    LIMIT 10
  `;

  return { topProducts };
}

async function getViewsAnalytics(start: Date, end: Date) {
  const pageViews = await prisma.productView.count({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  // Count unique sessions by grouping
  const uniqueSessionsResult = await prisma.productView.groupBy({
    by: ['sessionId'],
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      sessionId: {
        not: null,
      },
    },
  });

  const uniqueVisitors = uniqueSessionsResult.length;

  return {
    pageViews,
    uniqueVisitors,
  };
}

async function getCollectionAnalytics(start: Date, end: Date) {
  const collections = await prisma.collection.findMany({
    include: {
      products: {
        include: {
          product: true
        }
      }
    }
  });

  const collectionAnalytics = await Promise.all(
    collections.map(async (collection) => {
      const productIds = collection.products.map(p => p.product.id);
      
      const [sales, views] = await Promise.all([
        prisma.orderItem.aggregate({
          where: {
            productId: { in: productIds },
            order: {
              createdAt: { gte: start, lte: end },
              status: OrderStatus.DELIVERED
            }
          },
          _sum: {
            quantity: true,
            price: true
          }
        }),
        prisma.pageView.aggregate({
          where: {
            page: `/collections/${collection.id}`,
            timestamp: { gte: start, lte: end }
          },
          _sum: {
            views: true,
            uniqueVisitors: true
          }
        })
      ]);

      return {
        id: collection.id,
        name: collection.name,
        type: collection.type,
        totalViews: views._sum.views || 0,
        totalUniqueVisitors: views._sum.uniqueVisitors || 0,
        totalSales: sales._sum.quantity || 0,
        totalRevenue: sales._sum.price || 0,
        conversionRate: views._sum.uniqueVisitors 
          ? ((sales._sum.quantity || 0) / views._sum.uniqueVisitors) * 100 
          : 0
      };
    })
  );

  return { collections: collectionAnalytics };
}

async function calculateAnalytics(start: Date, end: Date) {
  // Parallel execution of all analytics queries
  const [
    salesData,
    customerData,
    productData,
    collectionData,
    viewsData
  ] = await Promise.all([
    getSalesAnalytics(start, end),
    getCustomerAnalytics(start, end),
    getProductAnalytics(start, end),
    getCollectionAnalytics(start, end),
    getViewsAnalytics(start, end)
  ]);

  const analyticsData = {
    ...salesData,
    ...customerData,
    ...productData,
    ...collectionData,
    ...viewsData
  };

  return analyticsData;
} 