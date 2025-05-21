import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// This special endpoint is designed to be called from the confirmation page
// after a user has been redirected from Curlec, without requiring authentication
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');

    // At least one of these must be provided
    if (!paymentId && !orderId) {
      return NextResponse.json({
        success: false,
        error: 'Either payment_id or order_id is required'
      }, { status: 400 });
    }

    // Build the query based on provided parameters
    const query: any = { OR: [] };

    if (paymentId) {
      query.OR.push({ stripePaymentIntentId: paymentId });
    }

    if (orderId) {
      query.OR.push({ id: orderId });
    }

    // Find the order without requiring a user session
    const order = await prisma.order.findFirst({
      where: query,
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        stripePaymentIntentId: true,
        userId: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Check if payment is verified
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        status: 'paid',
        orderId: order.id,
        userId: order.userId,
        paymentId: order.stripePaymentIntentId,
        total: order.total
      });
    } else {
      return NextResponse.json({
        success: false,
        status: order.paymentStatus.toLowerCase(),
        message: `Payment status is ${order.paymentStatus}`
      });
    }
  } catch (error) {
    console.error('Error verifying payment directly:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred while verifying the payment'
    }, { status: 500 });
  }
} 