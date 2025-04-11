import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { User, Order, Role } from "@prisma/client";

interface CustomerWithOrders {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
  orders: Pick<Order, "id" | "total">[];
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
          },
        },
      },
    });

    const customersWithStats = customers.map((customer: CustomerWithOrders): CustomerWithStats => ({
      ...customer,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce((sum: number, order: Pick<Order, "id" | "total">) => sum + order.total, 0),
    }));

    return NextResponse.json(customersWithStats);
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 