import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { formatPrice } from "@/utils/format";
import { addDays, format, subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get date range from query parameters or default to last 30 days
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const start = startDate ? new Date(startDate) : thirtyDaysAgo;
    const end = endDate ? new Date(endDate) : now;

    // Get sales data by day
    const salesByDay = await prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: OrderStatus.DELIVERED,
      },
      _sum: {
        total: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get sales data by category
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: OrderStatus.DELIVERED,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Calculate sales by category
    const salesByCategory = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (item.product?.category?.name) {
          const categoryName = item.product.category.name;
          acc[categoryName] = (acc[categoryName] || 0) + (item.quantity * item.price);
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Get customer acquisition data
    const customersByDay = await prisma.user.groupBy({
      by: ["createdAt"],
      where: {
        role: "USER",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _count: true,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: {
          not: null,
        },
        order: {
          createdAt: {
            gte: start,
            lte: end,
          },
          status: OrderStatus.DELIVERED,
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts
        .filter(item => item.productId !== null)
        .map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId! },
            select: {
              name: true,
              price: true,
              image: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          });

          const quantity = item._sum.quantity || 0;
          const price = product?.price ? Number(product.price) : 0;

          return {
            ...product,
            totalSold: quantity,
            revenue: quantity * price,
          };
        })
    );

    // Get collections with their analytics
    const collections = await prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        products: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // Calculate collection analytics based on their products' performance
    const collectionsWithAnalytics = await Promise.all(
      collections.map(async (collection) => {
        // Get all orders that contain products from this collection
        const collectionOrders = await prisma.order.findMany({
          where: {
            items: {
              some: {
                productId: {
                  in: collection.products.map(p => p.product.id),
                },
              },
            },
            createdAt: {
              gte: start,
              lte: end,
            },
            status: OrderStatus.DELIVERED,
          },
          include: {
            items: {
              where: {
                productId: {
                  in: collection.products.map(p => p.product.id),
                },
              },
            },
          },
        });

        // Calculate metrics
        const totalViews = Math.floor(Math.random() * 10000); // This would come from your analytics service
        const totalClicks = Math.floor(Math.random() * 1000); // This would come from your analytics service
        const totalConversions = collectionOrders.reduce((sum, order) => 
          sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );

        return {
          ...collection,
          totalViews,
          totalClicks,
          totalConversions,
          averageClickThroughRate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
          conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        };
      })
    );

    return NextResponse.json({
      salesByDay,
      salesByCategory,
      customersByDay,
      topProducts: topProductsWithDetails,
      collections: collectionsWithAnalytics,
    });
  } catch (error) {
    console.error("Error in analytics route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 