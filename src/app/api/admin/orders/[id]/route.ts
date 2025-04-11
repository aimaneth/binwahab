import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendOrderStatusEmail } from "@/lib/mail"
import { OrderStatus } from "@prisma/client"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
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
        shippingAddress: true,
      },
    })

    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("[ORDER_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { status } = body

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
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
                id: true,
                name: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    })

    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    // Handle stock updates based on status change
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      // Restore stock for cancelled orders
      for (const item of order.items) {
        if (item.variantId) {
          // Update variant stock
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        } else if (item.productId) {
          // Update product stock if no variant
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }
      }
    } else if (order.status === "CANCELLED" && status !== "CANCELLED") {
      // Deduct stock when uncancelling an order
      for (const item of order.items) {
        if (item.variantId) {
          // Check variant stock
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId }
          });
          if (!variant || variant.stock < item.quantity) {
            return new NextResponse(
              `Insufficient stock for variant ${variant?.id}`,
              { status: 400 }
            );
          }
          // Update variant stock
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        } else if (item.productId) {
          // Check product stock
          const product = await prisma.product.findUnique({
            where: { id: item.productId }
          });
          if (!product || (product.stock !== null && product.stock < item.quantity)) {
            return new NextResponse(
              `Insufficient stock for product ${product?.id}`,
              { status: 400 }
            );
          }
          // Update product stock
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: {
        id: params.id,
      },
      data: {
        status,
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
        shippingAddress: true,
      },
    })

    // Send email notification to customer
    if (order.user.email) {
      await sendOrderStatusEmail({
        orderId: order.id,
        status: status as OrderStatus,
        items: order.items.map((item) => ({
          productName: item.product?.name || "Unknown Product",
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        shippingAddress: {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.zipCode,
          country: order.shippingAddress.country,
        },
        customerEmail: order.user.email,
        customerName: order.user.name || "Customer",
      })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("[ORDER_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 