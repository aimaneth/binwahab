import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get current date and first day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get stats
    const [
      totalRevenue,
      lastMonthRevenue,
      totalProducts,
      lastMonthProducts,
      totalOrders,
      lastMonthOrders,
      totalCustomers,
      newCustomers,
      totalCollections,
      activeCollections,
      recentOrders,
      topProducts,
      topCollections,
      salesByDay,
    ] = await Promise.all([
      // Total revenue
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),
      // Last month revenue
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Total products
      prisma.product.count(),
      // Last month products
      prisma.product.count({
        where: {
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
      }),
      // Total orders
      prisma.order.count(),
      // Last month orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
      }),
      // Total customers
      prisma.user.count({
        where: {
          role: "USER",
        },
      }),
      // New customers this month
      prisma.user.count({
        where: {
          role: "USER",
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
      }),
      // Total collections
      prisma.collection.count(),
      // Active collections
      prisma.collection.count({
        where: {
          isActive: true,
        },
      }),
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
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
                },
              },
            },
          },
        },
      }),
      // Top products
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),
      // Top collections
      prisma.collection.findMany({
        where: {
          isActive: true,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
          products: {
            include: {
              product: {
                include: {
                  orderItems: true,
                },
              },
            },
          },
        },
        take: 5,
      }),
      // Sales by day (last 30 days)
      prisma.order.groupBy({
        by: ["createdAt"],
        _sum: {
          total: true,
        },
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    // Calculate revenue change
    const revenueChange = lastMonthRevenue._sum.total
      ? ((totalRevenue._sum.total! - lastMonthRevenue._sum.total) / lastMonthRevenue._sum.total) * 100
      : 0;

    // Calculate products change
    const productsChange = lastMonthProducts
      ? ((totalProducts - lastMonthProducts) / lastMonthProducts) * 100
      : 0;

    // Calculate orders change
    const ordersChange = lastMonthOrders
      ? ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100
      : 0;

    // Get product details for top products
    const productIds = topProducts.map((item) => item.productId).filter((id): id is number => id !== null);
    const productDetails = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
      },
    });

    // Combine product details with sales data
    const topProductsWithDetails = productIds.map((id) => {
      const product = productDetails.find((p) => p.id === id);
      const sales = topProducts.find((item) => item.productId === id);
      return {
        name: product?.name || "Unknown Product",
        price: product?.price || 0,
        image: product?.image,
        totalSold: sales?._sum.quantity || 0,
      };
    });

    // Calculate collection revenue
    const topCollectionsWithRevenue = topCollections.map((collection) => {
      let totalRevenue = 0;
      try {
        collection.products.forEach((pc) => {
          if (pc.product && pc.product.orderItems) {
            pc.product.orderItems.forEach((item) => {
              if (item.quantity && pc.product.price) {
                totalRevenue += Number(item.quantity) * Number(pc.product.price);
              }
            });
          }
        });
      } catch (error) {
        console.error("Error calculating collection revenue:", error);
      }

      return {
        name: collection.name,
        productCount: collection._count.products,
        totalRevenue,
      };
    });

    // Format sales by day
    const formattedSalesByDay = salesByDay.map((day) => ({
      date: day.createdAt.toISOString(),
      total: day._sum.total || 0,
    }));

    return NextResponse.json({
      stats: {
        revenue: {
          current: totalRevenue._sum.total || 0,
          change: revenueChange,
        },
        products: {
          total: totalProducts,
          change: productsChange,
        },
        orders: {
          current: totalOrders,
          change: ordersChange,
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
        },
        collections: {
          total: totalCollections,
          active: activeCollections,
        },
      },
      recentOrders,
      topProducts: topProductsWithDetails,
      topCollections: topCollectionsWithRevenue,
      salesByDay: formattedSalesByDay,
    });
  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Return fallback data when database is unavailable
    // This prevents authentication failures due to database issues
    return NextResponse.json({
      stats: {
        revenue: {
          current: 0,
          change: 0,
        },
        products: {
          total: 0,
          change: 0,
        },
        orders: {
          current: 0,
          change: 0,
        },
        customers: {
          total: 0,
          new: 0,
        },
        collections: {
          total: 0,
          active: 0,
        },
      },
      recentOrders: [],
      topProducts: [],
      topCollections: [],
      salesByDay: [],
      error: "Database temporarily unavailable. Data will refresh when connection is restored."
    });
  }
} 