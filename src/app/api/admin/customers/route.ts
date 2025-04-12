export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { User, Order, UserRole } from "@prisma/client";

interface CustomerWithOrders {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  role: UserRole;
  orders: Order[];
  _count: {
    orders: number;
  };
}

interface CustomerWithStats extends Omit<CustomerWithOrders, "orders"> {
  totalOrders: number;
  totalSpent: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const customers = await prisma.user.findMany({
      where: {
        role: UserRole.USER,
      },
      include: {
        orders: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const customersWithStats = customers.map((customer: CustomerWithOrders): CustomerWithStats => ({
      ...customer,
      totalOrders: customer._count.orders,
      totalSpent: customer.orders.reduce((sum: number, order: Order) => sum + order.total, 0),
    }));

    return NextResponse.json(customersWithStats);
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 