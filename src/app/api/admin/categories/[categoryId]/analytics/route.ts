import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { categoryId } = params;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7d";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Check if category exists
    const category = await (prisma as any).Category.findUnique({
      where: { id: categoryId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    // In a real application, you would fetch this data from your analytics service
    // For this example, we'll generate mock data
    
    // Mock data for overall analytics
    const views = Math.floor(Math.random() * 10000) + 5000;
    const clicks = Math.floor(views * (Math.random() * 0.3 + 0.1));
    const conversions = Math.floor(clicks * (Math.random() * 0.2 + 0.05));
    const conversionRate = (conversions / clicks) * 100;

    // Mock data for top products
    const productIds = category.products.map((p: any) => p.id);
    const topProducts = productIds.slice(0, 5).map((id: any) => {
      const product = category.products.find((p: any) => p.id === id);
      const productViews = Math.floor(Math.random() * 1000) + 100;
      const productClicks = Math.floor(productViews * (Math.random() * 0.3 + 0.1));
      const productConversions = Math.floor(productClicks * (Math.random() * 0.2 + 0.05));
      
      return {
        id,
        name: product?.name || "Unknown Product",
        views: productViews,
        clicks: productClicks,
        conversions: productConversions,
      };
    });

    // Mock data for traffic by day
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dayViews = Math.floor(Math.random() * 200) + 50;
      const dayClicks = Math.floor(dayViews * (Math.random() * 0.3 + 0.1));
      
      days.push({
        date: currentDate.toISOString().split('T')[0],
        views: dayViews,
        clicks: dayClicks,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Mock data for traffic sources
    const sources = [
      { source: "Direct", count: Math.floor(Math.random() * 3000) + 1000 },
      { source: "Organic Search", count: Math.floor(Math.random() * 4000) + 2000 },
      { source: "Referral", count: Math.floor(Math.random() * 2000) + 500 },
      { source: "Social", count: Math.floor(Math.random() * 1500) + 300 },
      { source: "Email", count: Math.floor(Math.random() * 1000) + 200 },
    ];

    return NextResponse.json({
      views,
      clicks,
      conversions,
      conversionRate,
      topProducts,
      trafficByDay: days,
      trafficBySource: sources,
    });
  } catch (error) {
    console.error("[CATEGORY_ANALYTICS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { views, clicks, conversions, revenue } = body;

    const analytics = await (prisma as any).CategoryAnalytics.upsert({
      where: {
        categoryId: params.categoryId,
      },
      create: {
        categoryId: params.categoryId,
        views: views || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        revenue: revenue || 0,
      },
      update: {
        views: views || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        revenue: revenue || 0,
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[CATEGORY_ANALYTICS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { views, clicks, conversions, revenue } = body;

    const analytics = await (prisma as any).CategoryAnalytics.update({
      where: {
        categoryId: params.categoryId,
      },
      data: {
        views: views || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        revenue: revenue || 0,
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[CATEGORY_ANALYTICS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 