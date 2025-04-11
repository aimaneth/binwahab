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
        productId: parseInt(params.productId),
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
    const { totalViews, uniqueViews, addToCartCount, purchaseCount } = body;

    const analytics = await prisma.productAnalytics.upsert({
      where: {
        productId: parseInt(params.productId),
      },
      create: {
        productId: parseInt(params.productId),
        totalViews: totalViews || 0,
        uniqueViews: uniqueViews || 0,
        addToCartCount: addToCartCount || 0,
        purchaseCount: purchaseCount || 0,
      },
      update: {
        totalViews: totalViews || 0,
        uniqueViews: uniqueViews || 0,
        addToCartCount: addToCartCount || 0,
        purchaseCount: purchaseCount || 0,
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
    const { totalViews, uniqueViews, addToCartCount, purchaseCount } = body;

    const analytics = await prisma.productAnalytics.update({
      where: {
        productId: parseInt(params.productId),
      },
      data: {
        totalViews: totalViews || 0,
        uniqueViews: uniqueViews || 0,
        addToCartCount: addToCartCount || 0,
        purchaseCount: purchaseCount || 0,
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[PRODUCT_ANALYTICS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 