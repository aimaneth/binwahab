import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const customer = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        addresses: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            isDefault: true,
          },
        },
        orders: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            total: true,
            items: {
              select: {
                id: true,
                product: {
                  select: {
                    name: true,
                  },
                },
                quantity: true,
                price: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      return new NextResponse("Customer not found", { status: 404 });
    }

    // Transform the data to match the expected format
    const transformedCustomer = {
      ...customer,
      orders: customer.orders.map((order: { 
        items: { 
          id: string;
          product: { name: string };
          quantity: number;
          price: number;
        }[];
      }) => ({
        ...order,
        items: order.items.map((item: {
          id: string;
          product: { name: string };
          quantity: number;
          price: number;
        }) => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
    };

    return NextResponse.json(transformedCustomer);
  } catch (error) {
    console.error("[CUSTOMER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 