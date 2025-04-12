import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({
        products: [],
        orders: [],
        customers: [],
      });
    }

    // Search in products
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: query, mode: Prisma.QueryMode.insensitive } }
        ],
      },
      include: {
        category: true,
        collections: {
          include: {
            collection: true,
          },
        }
      },
      take: 5,
    });

    // Search in orders
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { id: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { trackingNumber: { contains: query, mode: Prisma.QueryMode.insensitive } },
          {
            user: {
              OR: [
                { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
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
      take: 5,
    });

    // Search in customers (users)
    const customers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      take: 5,
    });

    return NextResponse.json({
      products: products,
      orders,
      customers,
    });
  } catch (error) {
    console.error("[SEARCH_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 