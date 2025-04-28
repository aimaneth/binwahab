import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createCurlecServerClient } from '@/lib/curlec/client';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    // Verify user is logged in
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get payment ID from params
    const { paymentId } = params;
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Create Curlec server client
    const curlecClient = createCurlecServerClient();
    
    // Look up the order in our database first by stripePaymentIntentId for now
    // In a future migration, you'd want to add curlecPaymentId to the Order model
    const order = await prisma.order.findFirst({
      where: {
        // Use the payment ID as a temporary identifier
        // Later implement a proper column in your Order table
        stripePaymentIntentId: paymentId, // as a placeholder
      }
    });

    // If we have an order and it's already completed, we can return the status from our database
    if (order && ['PAID', 'DELIVERED', 'SHIPPED'].includes(order.paymentStatus)) {
      return NextResponse.json({
        id: paymentId,
        orderId: order.id,
        amount: order.total,
        currency: order.currency || 'MYR',
        status: 'completed',
        // Handle paidAt field if it doesn't exist yet
        paidAt: new Date().toISOString(),
        metadata: {
          orderId: order.id
        }
      });
    }

    // Otherwise, check with Curlec API for the current status
    const paymentStatus = await curlecClient.checkPaymentStatus(paymentId);
    
    // If we have an order, update its status based on the Curlec response
    if (order && paymentStatus.status === 'completed') {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus: 'PAID',
          // Add paidAt in a future migration
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(paymentStatus);
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check payment status' 
      },
      { status: 500 }
    );
  }
} 