import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // First try to find the order for the authenticated user
    if (session?.user?.id) {
      const userOrder = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  options: true
                }
              }
            }
          },
          shippingAddress: true
        }
      });

      if (userOrder) {
        // Convert items to a more frontend-friendly format
        const formattedItems = userOrder.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name || 'Product',
          price: item.price,
          quantity: item.quantity,
          image: item.product?.images?.[0] || '',
          variantName: item.variant?.name || '',
          variantOptions: item.variant?.options || {}
        }));

        return NextResponse.json({
          id: userOrder.id,
          createdAt: userOrder.createdAt,
          updatedAt: userOrder.updatedAt,
          status: userOrder.status,
          total: userOrder.total,
          paymentStatus: userOrder.paymentStatus,
          paymentMethod: userOrder.paymentMethod,
          items: formattedItems,
          shippingAddress: userOrder.shippingAddress
        });
      }
    }

    // If no user is authenticated or the order doesn't belong to the user,
    // just return minimal public information about the order
    // This is useful for the success page which may not have a session yet
    let publicOrder = await prisma.order.findUnique({
      where: {
        id: orderId
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        total: true,
        paymentStatus: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                name: true,
                images: true
              }
            }
          }
        }
      }
    });

    // If not found by ID, try to find by Razorpay order ID
    if (!publicOrder) {
      publicOrder = await prisma.order.findFirst({
        where: {
          stripeSessionId: orderId // We're using stripeSessionId to store Razorpay order ID
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          total: true,
          paymentStatus: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  name: true,
                  images: true
                }
              }
            }
          }
        }
      });
    }

    if (!publicOrder) {
      console.error('Order not found:', { orderId });
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Format items for the response
    const items = publicOrder.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.product?.name || 'Product',
      image: item.product?.images?.[0] || ''
    }));

    return NextResponse.json({
      id: publicOrder.id,
      createdAt: publicOrder.createdAt,
      status: publicOrder.status,
      total: publicOrder.total,
      paymentStatus: publicOrder.paymentStatus,
      items
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
} 