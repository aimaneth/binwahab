import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendOrderStatusEmail } from "@/lib/mail"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { z } from "zod"

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
                price: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                options: true,
                price: true,
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

    // Transform the response to include the correct price
    const transformedOrder = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        price: item.variant?.price || item.product?.price || 0,
      })),
    }

    return NextResponse.json(transformedOrder)
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
    const { status, paymentStatus } = body

    // Validate status if provided
    if (status) {
      const statusSchema = z.enum([
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ])
      statusSchema.parse(status)
    }

    // Validate payment status if provided
    if (paymentStatus) {
      const paymentStatusSchema = z.enum([
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
      ])
      paymentStatusSchema.parse(paymentStatus)
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
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
              variant: {
                select: {
                  id: true,
                  name: true,
                  options: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      // Handle stock updates based on status change
      if (status === "CANCELLED" && order.status !== "CANCELLED") {
        // Restore stock for cancelled orders
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            })
          } else if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            })
          }
        }
      } else if (order.status === "CANCELLED" && status !== "CANCELLED") {
        // Check and deduct stock when uncancelling
        for (const item of order.items) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId }
            })
            if (!variant || variant.stock < item.quantity) {
              throw new Error(`Insufficient stock for variant ${variant?.id}`)
            }
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            })
          } else if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId }
            })
            if (!product || (product.stock !== null && product.stock < item.quantity)) {
              throw new Error(`Insufficient stock for product ${product?.id}`)
            }
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            })
          }
        }
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: {
          id: params.id,
        },
        data: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
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

      return updatedOrder
    })

    // Send email notification to customer outside transaction
    if (result.user.email && status) {
      await sendOrderStatusEmail({
        orderId: result.id,
        status: status as OrderStatus,
        items: result.items.map((item) => ({
          productName: item.product?.name || "Unknown Product",
          quantity: item.quantity,
          price: item.price,
        })),
        total: result.total,
        shippingAddress: {
          street: result.shippingAddress.street,
          city: result.shippingAddress.city,
          state: result.shippingAddress.state,
          postalCode: result.shippingAddress.zipCode,
          country: result.shippingAddress.country,
        },
        customerEmail: result.user.email,
        customerName: result.user.name || "Customer",
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    console.error("[ORDER_PATCH]", error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse("Internal error", { status: 500 })
  }
} 