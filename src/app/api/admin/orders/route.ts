import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrderStatus, User } from "@prisma/client"
import { z } from "zod"
import { sendOrderStatusUpdateEmail } from "@/lib/email"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") as OrderStatus | null
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build filter conditions
    const where = status ? { status } : {}

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
          shippingAddress: true,
          notes: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      orders,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error) {
    console.error("[ORDERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// PATCH /api/admin/orders/bulk
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { ids, action, data } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      return new NextResponse("Invalid request", { status: 400 })
    }

    let result

    switch (action) {
      case "updateStatus":
        if (!data || !data.status) {
          return new NextResponse("Status is required", { status: 400 })
        }
        
        // Validate status
        const statusSchema = z.enum([
          "PENDING",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ])
        
        const validatedStatus = statusSchema.parse(data.status)
        
        // Get orders with user information before updating
        const ordersToUpdate = await prisma.order.findMany({
          where: {
            id: { in: ids },
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        })
        
        // Update orders
        result = await prisma.order.updateMany({
          where: {
            id: { in: ids },
          },
          data: {
            status: validatedStatus,
          },
        })
        
        // Send email notifications
        await Promise.all(
          ordersToUpdate.map((order: { 
            user: { 
              email: string | null;
              name: string | null;
            };
            id: string;
          }) =>
            sendOrderStatusUpdateEmail({
              email: order.user.email!,
              orderId: order.id,
              status: validatedStatus,
              customerName: order.user.name || "Valued Customer",
            })
          )
        )
        
        return NextResponse.json({ success: true, count: result.count })

      default:
        return new NextResponse(`Invalid action: ${action}`, { status: 400 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    console.error("[ORDERS_BULK_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST /api/admin/orders/notes
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { orderId, content, isInternal } = body

    if (!orderId || !content) {
      return new NextResponse("Order ID and content are required", { status: 400 })
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    // Create note
    const note = await prisma.orderNote.create({
      data: {
        orderId,
        content,
        isInternal: isInternal || false,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("[ORDER_NOTES_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 