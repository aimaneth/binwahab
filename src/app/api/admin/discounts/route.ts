import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DiscountType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get active coupons
    const activeCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get active promotional campaigns
    const activeCampaigns = await prisma.promotionalCampaign.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        products: {
          include: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      activeCoupons,
      activeCampaigns,
    });
  } catch (error) {
    console.error("[DISCOUNTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    let result;

    if (type === "coupon") {
      // Create a new coupon
      result = await prisma.coupon.create({
        data: {
          code: data.code,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minPurchase: data.minPurchase,
          maxDiscount: data.maxDiscount,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          usageLimit: data.usageLimit,
          isActive: data.isActive !== false,
        },
      });
    } else if (type === "campaign") {
      // Create a new promotional campaign
      result = await prisma.promotionalCampaign.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          discountType: data.discountType,
          discountValue: data.discountValue,
          minPurchase: data.minPurchase,
          maxDiscount: data.maxDiscount,
          isActive: data.isActive !== false,
        },
      });
    } else {
      return new NextResponse("Invalid discount type", { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DISCOUNTS_POST]", error);
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
    const { type, id, data } = body;

    if (!type || !id || !data) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    let result;

    if (type === "coupon") {
      // Update a coupon
      result = await prisma.coupon.update({
        where: { id },
        data: {
          code: data.code,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minPurchase: data.minPurchase,
          maxDiscount: data.maxDiscount,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          usageLimit: data.usageLimit,
          isActive: data.isActive !== false,
        },
      });
    } else if (type === "campaign") {
      // Update a promotional campaign
      result = await prisma.promotionalCampaign.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          discountType: data.discountType,
          discountValue: data.discountValue,
          minPurchase: data.minPurchase,
          maxDiscount: data.maxDiscount,
          isActive: data.isActive !== false,
        },
      });
    } else {
      return new NextResponse("Invalid discount type", { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DISCOUNTS_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    let result;

    if (type === "coupon") {
      // Delete a coupon
      result = await prisma.coupon.delete({
        where: { id },
      });
    } else if (type === "campaign") {
      // Delete a promotional campaign
      result = await prisma.promotionalCampaign.delete({
        where: { id },
      });
    } else {
      return new NextResponse("Invalid discount type", { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DISCOUNTS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 