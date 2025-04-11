import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const analytics = await prisma.productAnalytics.findUnique({
      where: {
        productId: params.productId,
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[PRODUCT_ANALYTICS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { views, clicks, conversions, revenue } = body;

    const analytics = await prisma.productAnalytics.upsert({
      where: {
        productId: params.productId,
      },
      create: {
        productId: params.productId,
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
    console.error("[PRODUCT_ANALYTICS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { views, clicks, conversions, revenue } = body;

    const analytics = await prisma.productAnalytics.update({
      where: {
        productId: params.productId,
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
    console.error("[PRODUCT_ANALYTICS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 